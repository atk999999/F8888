import lz4.block,struct,pathlib
src=pathlib.Path('/mnt/data/tutien_inspect/data.unity3d')
b=src.read_bytes()
bi=lz4.block.decompress(b[64:64+2456],uncompressed_size=5627)
p=16
count=struct.unpack_from('>I',bi,p)[0];p+=4
print('Blocks',count)
blocks=[]
for i in range(count):
 unpacked,packed,flags=struct.unpack_from('>IIH',bi,p);p+=10
 blocks.append((unpacked,packed,flags))
print('total blocks',sum(x[0] for x in blocks),sum(x[1] for x in blocks),'types',set(x[2] for x in blocks),'first',blocks[:5]);
nnodes=struct.unpack_from('>I',bi,p)[0];p+=4;print('nodes',nnodes)
nodes=[]
for i in range(nnodes):
 offset,size,flags=struct.unpack_from('>QQI',bi,p);p+=20
 end=bi.index(b'\0',p);name=bi[p:end].decode('utf8','replace');p=end+1
 nodes.append((offset,size,flags,name))
print(nodes)
bo=(64+2456+15)//16*16
out=bytearray()
for i,(unpacked,packed,flags) in enumerate(blocks):
 chunk=b[bo:bo+packed];bo+=packed
 typ=flags&0x3f
 if typ in (2,3):
  d=lz4.block.decompress(chunk,uncompressed_size=unpacked)
 elif typ==0:d=chunk
 else:raise ValueError((i,typ))
 if len(d)!=unpacked:raise ValueError((i,len(d),unpacked))
 out.extend(d)
print('out',len(out),len(b),bo)
for offset,size,flags,name in nodes:
 path=pathlib.Path('/mnt/data/tutien_inspect/unityfs')/name
 path.parent.mkdir(parents=True,exist_ok=True)
 path.write_bytes(out[offset:offset+size]);print('created',path,size)
