"""python3 reverse/query.py 'EventOneD::CanDo4CD'"""
import argparse
import csv
import gzip
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description='Tra cứu chữ ký, địa chỉ RVA và hợp ngữ ARM64.')
    parser.add_argument('pattern', help='Một phần tên hàm, RVA hoặc method_index')
    parser.add_argument('--list', action='store_true', help='Chỉ in chữ ký và địa chỉ')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    matches = []
    with (root/'methods.tsv').open(encoding='utf8', newline='') as f:
        for row in csv.DictReader(f, delimiter='\t'):
            if (args.pattern.casefold() in row['signature'].casefold() or
                    args.pattern.casefold() in [row['method_index'], row['rva']]):
                matches.append(row)
    if not matches:
        parser.exit(1, 'Không tìm thấy hàm.\n')
    with gzip.open(root/'game-arm64.asm.gz', 'rb') as asm:
        for row in matches:
            print(row['method_index'], row['rva'] or row['state'], row['signature'])
            if row['state'] == 'code' and not args.list:
                asm.seek(int(row['listing_offset']))
                print(asm.read(int(row['listing_bytes'])).decode('utf8'))


if __name__ == '__main__':
    main()
