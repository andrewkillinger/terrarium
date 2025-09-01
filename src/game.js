(function(){
let engine;
function initGame(canvas,images){
 engine=new ex.Engine({canvasElement:canvas,width:512,height:288});
 const loader=new ex.Loader();
 const tex={};
 for(const [k,u] of Object.entries(images)){
  const img=new Image();img.crossOrigin='anonymous';img.src=u;const t=new ex.Texture(img);tex[k]=t;loader.addResource(t);
 }
 const villager=new ex.Actor({x:256,y:144,width:16,height:16,color:ex.Color.Yellow});
 villager.actions.repeatForever(ctx=>ctx.moveTo(Math.random()*512,Math.random()*288,20).delay(1000));
 engine.add(villager);
 engine.clock.schedule(()=>{paint(Math.floor(villager.pos.x),Math.floor(villager.pos.y),Materials.SEED,1);},2000,true);
 loader.suppressPlayButton=true;
 return engine.start(loader).then(()=>{
  const ks=Object.keys(tex);
  if(ks[0]){const a=new ex.Actor({x:64,y:240});a.graphics.use(tex[ks[0]].toSprite());engine.add(a);}
  if(ks[1]){const b=new ex.Actor({x:96,y:240});b.graphics.use(tex[ks[1]].toSprite());engine.add(b);}
 });
}
function getFps(){return engine?engine.clock.fps:0;}
window.initGame=initGame;window.getFps=getFps;
})();
