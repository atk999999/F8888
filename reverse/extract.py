"""python3 extract.py SOURCE.apk REA68_Report.tar.gz OUT_DIR
Needs Linux, GNU readelf, and libLLVM with AArch64 support (tested with 20)."""
import argparse
import collections
import csv
import ctypes as C
import ctypes.util
import gzip
import hashlib
import json
import pathlib
import re
import struct
import subprocess
import tarfile
import tempfile
import zipfile


def disassembler():
    path = next((p for major in range(22, 13, -1)
                 if (p := ctypes.util.find_library(f'LLVM-{major}'))), None)
    if not path:
        raise RuntimeError('libLLVM missing')
    lib = C.CDLL(path)
    for part in ['TargetInfo', 'Target', 'TargetMC', 'AsmPrinter', 'Disassembler']:
        getattr(lib, 'LLVMInitializeAArch64' + part)()
    lib.LLVMCreateDisasm.argtypes = [C.c_char_p, C.c_void_p, C.c_int, C.c_void_p, C.c_void_p]
    lib.LLVMCreateDisasm.restype = C.c_void_p
    context = lib.LLVMCreateDisasm(b'aarch64-linux-android', None, 0, None, None)
    if not context:
        raise RuntimeError('AArch64 unsupported')
    decode = lib.LLVMDisasmInstruction
    decode.argtypes = [C.c_void_p, C.c_void_p, C.c_uint64, C.c_uint64, C.c_void_p, C.c_size_t]
    decode.restype = C.c_size_t
    buffer = C.create_string_buffer(256)

    def one(data, pc):
        if decode(context, data, len(data), pc, buffer, len(buffer)) == 4:
            return ' '.join(buffer.value.decode().split())
        return None
    return one


def write(path, text):
    path.write_text(text, encoding='utf8')


def read_literals(elf, report):
    """Resolve GOT entries that point at tagged il2cpp string-literal slots."""
    shoff = struct.unpack_from('<Q', elf, 40)[0]
    stride, count = struct.unpack_from('<HH', elf, 58)
    sections = [struct.unpack_from('<IIQQQQIIQQ', elf, shoff+i*stride) for i in range(count)]
    segments = [s for s in sections if s[1] == 1 and s[2] & 2 and s[5]]
    literal_slots = {}
    values = report['string_literals']
    for sec in sections:
        if sec[1] != 4:
            continue
        for address, info, addend in struct.iter_unpack('<QQq', elf[sec[4]:sec[4]+sec[5]]):
            if info & 0xffffffff != 1027:
                continue
            section = next((s for s in segments if s[3] <= addend and addend+8 <= s[3]+s[5]), None)
            if section is None:
                continue
            token = struct.unpack_from('<Q', elf, section[4]+addend-section[3])[0]
            if token & 0xffffffffe0000001 != 0xa0000001:
                continue
            index = (token & 0x1fffffff) >> 1
            if index < len(values) and values[index]['value'] is not None:
                literal_slots[address] = index, values[index]['value']
    return literal_slots


def main():
    p = argparse.ArgumentParser(description=__doc__)
    for arg in ['apk', 'report', 'output']:
        p.add_argument(arg, type=pathlib.Path)
    args = p.parse_args()
    out = args.output
    out.mkdir(parents=True, exist_ok=True)
    with tarfile.open(args.report) as archive:
        report = json.load(archive.extractfile('binary_evidence.json'))['records'][0]['normalized_result']
    with zipfile.ZipFile(args.apk) as archive:
        elf = archive.read('lib/arm64-v8a/libil2cpp.so')
        metadata = archive.read('assets/bin/Data/Managed/Metadata/global-metadata.dat')
    for data, expected in [(elf, report['binary']['artifact']), (metadata, report['artifact'])]:
        if hashlib.sha256(data).hexdigest() != expected['sha256']:
            raise ValueError('APK differs from REA report')
    with tempfile.NamedTemporaryFile() as tmp:
        tmp.write(elf)
        tmp.flush()
        fde = {}
        with subprocess.Popen(['readelf', '-wf', tmp.name], stdout=subprocess.PIPE, text=True) as proc:
            for line in proc.stdout:
                match = re.search(r' FDE cie=\w+ pc=(\w+)\.\.(\w+)', line)
                if match:
                    start, end = [int(s, 16) for s in match.groups()]
                    fde[start] = end
            if proc.wait():
                raise RuntimeError('readelf failed')
    phoff, = struct.unpack_from('<Q', elf, 32)
    entsize, count = struct.unpack_from('<HH', elf, 54)
    ranges = []
    for i in range(count):
        typ, flags, off, addr, _, size = struct.unpack_from('<IIQQQQ', elf, phoff + entsize*i)
        if typ == 1 and flags & 1:
            ranges.append((addr, addr+size, off))
    methods, addresses, types = [report[k] for k in ('methods', 'method_addresses', 'types')]
    def typename(i):
        t = types[i]
        if t['declaring_type'] >= 0:
            return typename(t['declaring_type']) + '+' + t['name']
        return (t['namespace'] + '.' if t['namespace'] else '') + t['name']
    def fullname(i):
        return typename(methods[i]['declaring_type']) + '::' + methods[i]['name']
    addresses_to_names = collections.defaultdict(list)
    for i, a in enumerate(addresses):
        if a['state'] == 'code':
            addresses_to_names[int(a['rva'], 16)].append(fullname(i))
    image = next(x for x in report['images'] if x['name'] == 'Assembly-CSharp.dll')
    game_types = range(image['type_start'], image['type_start'] + image['type_count'])
    params = collections.defaultdict(list)
    for param, typ in zip(report['parameters'], report['parameter_types']):
        params[param['method']].append((typ['name'] or '?') + ' ' + param['name'])
    literal_slots = read_literals(elf, report)
    decode = disassembler()
    counters = collections.Counter()
    with gzip.open(out / 'game-arm64.asm.gz', 'wb') as assembly, (out/'methods.tsv').open('w', encoding='utf8', newline='') as index:
        rows = csv.writer(index, delimiter='\t', lineterminator='\n')
        rows.writerow(['method_index','signature','state','rva','end_exclusive','machine_bytes','listing_offset','listing_bytes','undecoded_words'])
        for i, (method, item) in enumerate(zip(methods, addresses)):
            if method['declaring_type'] not in game_types:
                continue
            sig = f"{report['return_types'][i]['name'] or '?'} {fullname(i)}({', '.join(params[i])})"
            counters[item['state']] += 1
            if item['state'] != 'code':
                rows.writerow([i, sig, item['state'], '', '', 0, '', 0, 0])
                continue
            start = int(item['rva'], 16)
            end = fde[start]
            delta = next(off-base for base, limit, off in ranges if base<=start<end<=limit)
            if (end-start) % 4:
                raise ValueError('Non-aligned method')
            pos = assembly.tell()
            lines = [f'\n; {sig}   RVA {start:#x}..{end:#x}\n']
            undecoded = 0
            previous = 0
            for pc in range(start, end, 4):
                raw = elf[pc+delta:pc+delta+4]
                op = int.from_bytes(raw, 'little')
                asm = decode(raw, pc)
                if asm is None:
                    undecoded += 1
                    asm = '.word ' + hex(op)
                if op >> 26 in (0b100101, 0b000101):
                    disp = op & 0x3ffffff
                    if disp & 0x2000000:
                        disp -= 0x4000000
                    target = pc + disp*4
                    label = ' | '.join(addresses_to_names.get(target, []))
                    asm += f' ; → {target:#x}' + (' '+label if label else '')
                # Resolve only adjacent ADRP + 64-bit LDR with the same base.
                if previous & 0x9f000000 == 0x90000000 and op & 0xffc00000 == 0xf9400000 and previous & 31 == (op >> 5) & 31:
                    pages = ((previous >> 29) & 3) | (((previous >> 5) & 0x7ffff) << 2)
                    if pages & 0x100000:
                        pages -= 0x200000
                    addr = ((pc-4) & ~4095) + (pages << 12) + ((op >> 10) & 4095)*8
                    if addr in literal_slots:
                        j, value = literal_slots[addr]
                        asm += ' ; literal[' + str(j) + '] ' + json.dumps(value, ensure_ascii=False)
                previous = op
                lines.append(f'{pc:08x}  {op:08x}  {asm}\n')
            listing = ''.join(lines).encode('utf8')
            assembly.write(listing)
            rows.writerow([i, sig, 'code', hex(start), hex(end), end-start, pos, len(listing), undecoded])
            counters['machine_bytes'] += end-start
            counters['undecoded_words'] += undecoded
    counters['types'] = len(game_types)
    counters['apk_sha256'] = hashlib.sha256(args.apk.read_bytes()).hexdigest()
    counters['libil2cpp_sha256'] = report['binary']['artifact']['sha256']
    counters['metadata_sha256'] = report['artifact']['sha256']
    write(out/'coverage.json', json.dumps(dict(counters), indent=2))
    print(dict(counters))


if __name__ == '__main__':
    main()
