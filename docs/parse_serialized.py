import pathlib,struct,collections,json,sys
root=pathlib.Path('/mnt/data/tutien_inspect/unityfs')
class R:
 def __init__(self,data,pos=0,endian='<'):self.b=data;self.p=pos;self.e=endian
 def rd(self,n):v=self.b[self.p:self.p+n];self.p+=n;return v
 def n(self,fmt):fmt=self.e+fmt;val=struct.unpack_from(fmt,self.b,self.p)[0];self.p+=struct.calcsize(fmt);return val
 def s(self):
  e=self.b.index(b'\0',self.p);v=self.b[self.p:e];self.p=e+1;return v.decode('utf8','replace')
 def align(self,n=4):self.p=(self.p+n-1)&~(n-1)
def parse(path):
 b=path.read_bytes();v=struct.unpack_from('>I',b,8)[0];assert v==22
 meta,filesize,data_offset,unknown=struct.unpack_from('>IQQQ',b,20)
 r=R(b,48)
 unity=r.s();platform=r.n('i');typetree=r.n('B');nTypes=r.n('i');types=[]
 for i in range(nTypes):
  cl=r.n('i');stripped=r.n('B');si=r.n('h');scriptid=r.rd(16) if cl==114 or cl<0 else b'';hash=r.rd(16)
  nodes=[]
  if typetree:
   nn=r.n('i');ss=r.n('i');
   if nn <0 or nn>20000 or ss<0 or ss>1e7:raise ValueError(('bad-nodes',path.name,i,cl,nn,ss,r.p))
   tree=r.rd(nn*32);st=r.rd(ss)
   for k in range(nn):
    a=struct.unpack_from('<HBBIIiiiQ',tree,k*32)
    level,flags,typeFlag,nameFlag=a[1],a[2],a[3],a[4]
    def s(a):
     if a & (1<<31):return 'common_'+str(a&0x7fffffff)
     e=st.find(b'\0',a);return st[a:e].decode('utf8','replace') if e!=-1 else '?'+str(a)
    nodes.append((level,s(typeFlag),s(nameFlag),a[5],a[7],a[8]))
  # Unity version 21+, for non ref type list of dependencies
  depN=r.n('i') if typetree else 0
  if depN<0 or depN>5000:raise ValueError(('deps',path.name,i,cl,depN,r.p))
  deps=[r.n('i') for _ in range(depN)]
  types.append({'class':cl,'nodes':nodes,'deps':deps,'scriptidx':si})
 objectN=r.n('i')
 if objectN<0 or objectN>100000:raise ValueError(('objects',path.name,objectN,r.p))
 objects=[]
 for j in range(objectN):
  r.align();pid=r.n('q');byteStart=r.n('q')+data_offset;bs=r.n('I');ti=r.n('i')
  objects.append({'pid':pid,'offset':byteStart,'size':bs,'typeIndex':ti,'class':types[ti]['class']})
 return {'path':str(path),'unity':unity,'platform':platform,'nTypes':nTypes,'types':types,'objects':objects,'next':r.p,'dataOffset':data_offset,'fileSize':filesize,'meta':meta,'nObjects':objectN}
if __name__=='__main__':
 result=[]
 for path in root.rglob('*'):
  if not path.is_file() or path.name.endswith('.resS'):continue
  try:
   d=parse(path);print(path.name, 'classes',collections.Counter(o['class'] for o in d['objects']),'objs',d['nObjects'],'types',d['nTypes'],'next',d['next'],'data',d['dataOffset'],'meta',d['meta']);result.append(d)
  except Exception as e:print('ERROR',path,e)
 pathlib.Path('/mnt/data/tutien_inspect/objects_manifest.json').write_text(json.dumps(result,ensure_ascii=False),encoding='utf8')
