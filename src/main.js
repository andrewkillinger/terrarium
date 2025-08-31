(async function(){
const caCanvas=document.getElementById('ca'),gameCanvas=document.getElementById('game'),diag=document.getElementById('diag');
function err(msg){diag.textContent=msg;diag.style.color='#f00';throw msg}
if(!window.ex||!window.Tone||!caCanvas||!gameCanvas)err('Missing engine or canvases');
function resize(){const s=Math.min(innerWidth/512,innerHeight/288);document.documentElement.style.setProperty('--scale',s)}
window.addEventListener('resize',resize);resize();
const res=await fetch('config/assets.manifest.json');if(!res.ok)err('manifest load fail');const manifest=await res.json();if(location.protocol==='https:'){for(const url of [...Object.values(manifest.images),...Object.values(manifest.audio)])if(url.startsWith('http:'))err('Mixed content: use HTTPS')}
const textures={},assetStatus={};await Promise.all(Object.entries(manifest.images).map(([k,url])=>new Promise(r=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>{textures[k]=img;assetStatus[k]='ok';r()};img.onerror=()=>{assetStatus[k]='fail';r()};img.src=url;})));
ca.initCA(caCanvas,512,288);ca.stepCA(0);
audio.initAudio(manifest);const engine=game.initGame(textures);
let brush=ca.Materials.SAND,size=4,painting=false;document.querySelectorAll('#toolbar button').forEach(b=>b.onclick=()=>{brush=+b.dataset.mat;audio.playClick()});document.getElementById('size').oninput=e=>size=+e.target.value;
function paintEvt(e){const rect=caCanvas.getBoundingClientRect();const x=Math.floor((e.clientX-rect.left)/rect.width*512);const y=Math.floor((e.clientY-rect.top)/rect.height*288);ca.paint(x,y,brush,size);if(brush===ca.Materials.WATER||brush===ca.Materials.SEED)audio.playPlop()}
caCanvas.onpointerdown=e=>{painting=true;paintEvt(e)};window.onpointerup=()=>painting=false;caCanvas.onpointermove=e=>{if(painting)paintEvt(e)};
let hidden=false;document.addEventListener('visibilitychange',()=>{hidden=document.hidden;if(hidden)Tone.Transport.pause();else Tone.Transport.start()});
engine.on('postupdate',evt=>{if(!hidden){ca.stepCA(evt.delta);audio.updateAudio(ca.getStats());}
const s=ca.getStats();const assets=Object.entries(assetStatus).map(([k,v])=>`${k}:${v}`).join(' ');diag.textContent=`fps:${game.getFps().toFixed(0)} bodies:${engine.currentScene.actors.length}\nwater:${s.water} sand:${s.sand} plant:${s.plant} fire:${s.fire}\n${assets}`;});
})();
