import json,struct,pathlib,re,collections
from PIL import Image
ROOT=pathlib.Path('/mnt/data/tutien_inspect/unityfs')
OUT=pathlib.Path('/mnt/data/tutien_inspect/exported_textures');OUT.mkdir(exist_ok=True)
D=json.loads(pathlib.Path('/mnt/data/tutien_inspect/objects_manifest.json').read_text())
records=[]
for d in D:
 src=pathlib.Path(d['path']);b=src.read_bytes()
 for o in d['objects']:
  if o['class']!=28:continue
  a=b[o['offset']:o['offset']+o['size']]
  nl=struct.unpack_from('<i',a,0)[0]
  if nl<0 or nl>2048:continue
  name=a[4:4+nl].decode('utf8','replace');p=(4+nl+3)&~3
  if p+0x70>len(a):continue
  w,h,complete,mstr,fmt,mips=struct.unpack_from('<iiiiii',a,p+8)
  n=struct.unpack_from('<I',a,p+0x5c)[0]
  if n:
   dat=a[p+0x60:p+0x60+n];kind='inline';streamname=None
  else:
   offset=struct.unpack_from('<Q',a,p+0x60)[0]
   sz=struct.unpack_from('<I',a,p+0x68)[0]
   pathlen=struct.unpack_from('<I',a,p+0x6c)[0]
   streamname=a[p+0x70:p+0x70+pathlen].decode('utf8','replace')
   resp=src.parent/pathlib.Path(streamname).name
   dat=resp.read_bytes()[offset:offset+sz] if resp.is_file() else b''
   kind='streamed'
  ext='';path='';error=''
  filename=f'{src.stem}__{o["pid"]:04d}__{re.sub(r"[^\w\u4e00-\u9fff-]+","_",name)[:42]}'
  # save original pixels byte-exact for all textures, including ETC
  if dat:
   rawdir=OUT/'raw';rawdir.mkdir(exist_ok=True)
   raw=rawdir/(filename+f'.tex{fmt}.bin');raw.write_bytes(dat)
  if 0<w<=8192 and 0<h<=8192 and len(dat)>0:
   im=None
   try:
    if fmt==4 and len(dat)>=w*h*4: im=Image.frombytes('RGBA',(w,h),dat[:w*h*4])
    elif fmt==3 and len(dat)>=w*h*3:im=Image.frombytes('RGB',(w,h),dat[:w*h*3])
    elif fmt==1 and len(dat)>=w*h:im=Image.new('RGBA',(w,h),(255,255,255,255));im.putalpha(Image.frombytes('L',(w,h),dat[:w*h]))
    if im:
     im=im.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
     out=OUT/(filename+'.webp')
     im.save(out,format='WEBP',quality=87,method=5,lossless=(max(w,h)<=128))
     ext='webp';path=out.name
   except Exception as e:error=str(e)
  rec=dict(name=name,file=src.name,pathID=o['pid'],width=w,height=h,format=fmt,completeSize=complete,mips=mips,storage=kind,payloadBytes=len(dat),image=path,originalPixels=(f'raw/{filename}.tex{fmt}.bin' if dat else ''),streamname=streamname,error=error)
  records.append(rec)
C=collections.Counter((r['format'],bool(r['image'])) for r in records)
print('total textures',len(records),'counts',C,'image exported',len([r for r in records if r['image']]),'payloads',len([r for r in records if r['originalPixels']]))
(OUT/'texture_manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf8')
print('main images',[(r['name'],r['image']) for r in records if r['image'] and not r['name'].startswith('tap')][:40])
