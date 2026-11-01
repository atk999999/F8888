import React from 'react';
import textures from './data/texture_manifest.json';
import audioFiles from './data/audio_manifest.json';

type Tex = (typeof textures)[number];
const viNames:Record<string,string> = {
 '背景2':'Bầu trời tu tiên', '背景图':'Tinh không huyền ảo', '开始标题':'Biểu tượng tiêu đề gốc',
 '天赋颜色':'Sắc độ thiên phú', '地球':'Địa cầu', '选中':'Đang lựa chọn', '圈':'Vòng tròn linh khí',
 '循环图标':'Luân hồi', '框':'Khung', '按钮框':'Khung nút', '减':'Giảm',
 '加':'Tăng', '播放':'Phát', '联系':'Liên hệ', '关闭':'Đóng',
 '对话':'Đàm thoại', '声音开':'Bật âm thanh', '声音关':'Tắt âm thanh',
 'CK':'Bảng ghép ảnh / atlas', '背景色':'Màu nền'
};
const path=(p:string)=>import.meta.env.BASE_URL+p;
const isSdk=(n:string)=>/tap|sdk|toast|quickverify|warning|error|scroll|checkmark|unity|splash|font|client|button|dropdown|network|icon2|^icon$|^user$|^bar$|fps|graphiccard|memory|software|date|log|search|back|clear|collapse|selected|^on$|^off$|^background$|^uimask$|^star$|^loading$|^detail_bg$/i.test(n);
function CompressedPreview({texture}: {texture:Tex}) {
 const canvas=React.useRef<HTMLCanvasElement>(null);
 const [result,setResult]=React.useState('Đang mở dữ liệu ảnh nén…');
 React.useEffect(()=>{
  let cancelled=false;
  async function render(){
   const node=canvas.current;
   if(!node||!texture.originalPixels) {setResult('Không có dữ liệu pixel.');return;}
   const gl=node.getContext('webgl2',{alpha:true,preserveDrawingBuffer:true});
   if(!gl){setResult('Trình duyệt không hỗ trợ WebGL2. Tệp pixel nguyên bản vẫn được bảo lưu.');return;}
   const fmt=texture.format===47 ? 0x9278 /* ETC2 RGBA8 */ : texture.format===34 ? 0x9274 /* ETC2 RGB8 */ : 0;
   if(!fmt){setResult('Định dạng ảnh chưa được hỗ trợ.');return;}
   try {
    const response=await fetch(path(texture.originalPixels));
    if(!response.ok)throw Error('Không thể đọc tệp pixel.');
    const raw=new Uint8Array(await response.arrayBuffer());
    if(cancelled)return;
    const w=texture.width,h=texture.height;
    node.width=w; node.height=h;
    const byteCount=Math.ceil(w/4)*Math.ceil(h/4)*(texture.format===47?16:8);
    if(raw.length<byteCount)throw Error('Dữ liệu texture không đầy đủ.');
    const vert=`#version 300 es\nprecision highp float;in vec2 a;out vec2 uv;void main(){uv=vec2((a.x+1.)/2.,(1.-a.y)/2.);gl_Position=vec4(a,0.,1.);}`;
    const frag=`#version 300 es\nprecision highp float;in vec2 uv;uniform sampler2D t;out vec4 c;void main(){c=texture(t,uv);}`;
    const make=(type:number,source:string)=>{const sh=gl.createShader(type);if(!sh)throw Error('Không tạo được shader.');gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error('Shader: '+gl.getShaderInfoLog(sh));return sh;};
    const program=gl.createProgram();if(!program)throw Error('Không thể tạo chương trình WebGL.');
    gl.attachShader(program,make(gl.VERTEX_SHADER,vert));gl.attachShader(program,make(gl.FRAGMENT_SHADER,frag));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Không thể ghép shader.');
    gl.useProgram(program);
    const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
    const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.compressedTexImage2D(gl.TEXTURE_2D,0,fmt,w,h,0,raw.subarray(0,byteCount));
    if(gl.getError()!==gl.NO_ERROR)throw Error('Thiết bị chưa giải mã được ETC2.');
    gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    if(gl.getError()!==gl.NO_ERROR)throw Error('Lỗi render WebGL2.');
    setResult('');
   } catch(e){if(!cancelled)setResult(e instanceof Error?e.message:String(e));}
  }
  void render();return()=>{cancelled=true;};
 },[texture]);
 return <div className="compressed-wrap"><canvas ref={canvas} className="compressed-canvas" />{result&&<div className="compressed-note">{result}</div>}</div>;
}
export default function AssetLibrary(){
 const [query,setQuery]=React.useState('');
 const [scope,setScope]=React.useState<'all'|'game'|'technical'>('game');
 const [selected,setSelected]=React.useState<Tex|null>(null);
 const [page,setPage]=React.useState(0);
 const filtered=textures.filter(x=>(scope==='all'||(scope==='game'?!isSdk(x.name):isSdk(x.name)))&&`${x.name} ${viNames[x.name]||''} ${x.pathID} ${x.file}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
 const paged=filtered.slice(page*36,page*36+36);
 const converted=textures.filter(t=>t.image).length;
 return <div className="page-content asset-library">
  <header className="asset-heading"><div className="eyebrow">TÀI NGUYÊN TRÍCH XUẤT TỪ APK 1.8</div><h2>Kho nguyên liệu tu chân</h2><p>Tài nguyên gốc được bảo toàn để dựng lại đồ họa và âm thanh. Tư liệu đã nhận dạng không đồng nghĩa toàn bộ gameplay Unity đã chuyển sang React.</p></header>
  <div className="asset-facts"><div><b>{textures.length}</b><span>Texture Unity</span></div><div><b>{converted}</b><span>Ảnh WebP xem được</span></div><div><b>{textures.length-converted}</b><span>Texture không có pixel</span></div><div><b>{audioFiles.length}</b><span>Đoạn âm thanh FSB5</span></div></div>
  <section className="asset-box"><div className="asset-tool-row"><input aria-label="Tìm hình ảnh" value={query} placeholder="Tìm ảnh, tên gốc hoặc mã ID…" onChange={e=>{setQuery(e.target.value);setPage(0)}}/><select aria-label="Nhóm dữ liệu" value={scope} onChange={e=>{setScope(e.target.value as typeof scope);setPage(0)}}><option value="game">Hình ảnh trò chơi</option><option value="all">Toàn bộ texture</option><option value="technical">Giao diện kỹ thuật / SDK</option></select></div>
   <p className="asset-caption">Có {filtered.length} texture theo bộ lọc. Chạm vào ảnh để xem kích thước, mã gốc và tệp lưu. Hình nén ETC2 có thể xem bằng WebGL2 trên thiết bị hỗ trợ.</p>
   {selected&&<div className="asset-selection"><button className="asset-selection-close" onClick={()=>setSelected(null)}>×</button><h3>{viNames[selected.name]||selected.name}</h3><div className="asset-preview">{selected.image?<img src={path(selected.image)} alt={viNames[selected.name]||selected.name}/>:selected.originalPixels?<CompressedPreview texture={selected}/>:<p>Không có pixel ảnh.</p>}</div><p>{selected.name} · ID {selected.pathID} · {selected.width} × {selected.height} · Unity TextureFormat {selected.format}</p><div className="asset-links">{selected.image&&<a href={path(selected.image)} download>Tải WebP</a>}{selected.originalPixels&&<a href={path(selected.originalPixels)} download>Tải pixel gốc</a>}</div></div>}
   <div className="asset-gallery">{paged.map(t=><button key={`${t.file}-${t.pathID}`} className={'asset-tile '+(selected?.pathID===t.pathID&&selected?.file===t.file?'selected':'')} onClick={()=>setSelected(t)}><span className="asset-thumb">{t.image?<img loading="lazy" src={path(t.image)} alt=""/>:<span>◇<small>{t.originalPixels?'ETC2 / nén':'Không có pixel'}</small></span>}</span><b>{viNames[t.name]||t.name}</b><small>{t.width}×{t.height} · #{t.pathID}</small></button>)}</div>
   <div className="asset-pager"><button disabled={page===0} onClick={()=>setPage(p=>p-1)}>← Trang trước</button><span>Trang {page+1}/{Math.max(1,Math.ceil(filtered.length/36))}</span><button disabled={(page+1)*36>=filtered.length} onClick={()=>setPage(p=>p+1)}>Trang sau →</button></div>
  </section>
  <section className="asset-box"><div className="eyebrow">ÂM THANH THỰC TỪ APK</div><h3>Âm thanh nguyên bản</h3><p className="asset-caption">Đã tách đúng ba AudioClip từ hai tệp sharedassets.resource. Có thể nghe trực tiếp cả ba bản Ogg Vorbis.</p><div className="asset-audio-list">{audioFiles.map(a=><div key={a.file}><span>♫</span><div><b>{a.name}</b><small>{(a.length/1024).toFixed(1)} KB · FSB5 gốc</small></div><audio controls preload="none" src={path(a.ogg)}/><a href={path(a.file)} download>Xuất tệp FSB</a></div>)}</div></section>
  <section className="asset-box"><div className="eyebrow">DỮ LIỆU GỐC</div><h3>Kho tệp chưa chỉnh sửa</h3><p className="asset-caption">Kho dữ liệu gốc được bảo quản trong <code>archive/WoYaoXiuZhen_1.8.apk</code> và tự phục hồi thư mục <code>public/original/</code> bằng lệnh <code>npm run dev</code>. Gồm UnityFS, bank FSB, metadata IL2CPP, thư viện Android và các bảng JSON. APK lưu trữ giữ nguyên toàn bộ 1.600 tệp. Bảng kiểm kê SHA-256 nằm ở <code>docs/apk_assets_sha256.json</code>.</p><div className="asset-links"><a href="/original/assets/General/config_event.json" download>824 sự kiện gốc</a><a href="/original/assets/bin/Data/data.unity3d" download>Gói UnityFS</a><a href="/assets/texture_manifest.json" download>Danh mục texture</a></div></section>
 </div>;
}
