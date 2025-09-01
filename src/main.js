document.addEventListener('DOMContentLoaded',()=>{
 const diag=document.getElementById('diag');
 const ca=document.getElementById('ca');
 const game=document.getElementById('game');
 function error(msg){const d=document.createElement('div');d.textContent=msg;d.style.color='red';d.style.fontFamily='monospace';diag.appendChild(d);}
 if(!window.ex){error('Excalibur missing');return;}
 if(!ca||!game||ca.width!==512||ca.height!==288||game.width!==512||game.height!==288){error('Missing engine or canvases');return;}
 ca.getContext('2d').fillStyle='#555';ca.getContext('2d').fillRect(0,0,512,288);
 game.getContext('2d').fillStyle='#555';game.getContext('2d').fillRect(0,0,512,288);
 fetch('./config/assets.manifest.json').then(r=>r.json()).then(man=>{
  if(location.protocol==='https:'){
   const urls=JSON.stringify(man);
   if(urls.indexOf('"http:')>-1){error('Mixed content');return;}
  }
  start(man);
 }).catch(()=>error('Manifest load failed'));
 function start(man){
  Tone.start();
  initAudio(man.audio);
  initCA(ca,512,288);
  initGame(game,man.images).then(()=>loop());
  const brush=document.getElementById('brush');
  const size=document.getElementById('size');
  let painting=false;
  game.addEventListener('pointerdown',e=>{painting=true;paintAt(e);playPlop();});
  game.addEventListener('pointermove',e=>{if(painting)paintAt(e);});
  window.addEventListener('pointerup',()=>painting=false);
  function paintAt(e){const rect=game.getBoundingClientRect();const x=(e.clientX-rect.left)/rect.width*512;const y=(e.clientY-rect.top)/rect.height*288;paint(x|0,y|0,parseInt(brush.value),parseInt(size.value));}
 }
 let last=0;
 function loop(ts){const dt=ts-last;last=ts;stepCA(dt);const stats=getStats();diag.textContent=`FPS ${getFps().toFixed(0)} S:${stats.SAND} W:${stats.WATER} P:${stats.PLANT}`;if(document.hidden){Tone.Transport.pause();setTimeout(()=>loop(performance.now()),500);}else{Tone.Transport.start();requestAnimationFrame(loop);}}
 document.addEventListener('visibilitychange',()=>{});
});
