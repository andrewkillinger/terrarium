(function(){
let engine,fps=0;
function initGame(tex){
const canvas=document.getElementById('game');
engine=new ex.Engine({canvas,width:512,height:288,pixelRatio:1,antialiasing:false});
const fol=new ex.ImageSource(tex['foliage.default.001']);
const prop=new ex.Actor({x:80,y:256,width:32,height:32});
prop.graphics.use(fol.toSprite());
engine.add(prop);
const vill=new ex.Actor({x:256,y:100,width:10,height:16,color:ex.Color.fromHex('#ffe0b5')});
let dir=ex.Vector.Zero,seedTimer=0;
vill.on('postupdate',evt=>{
if(Math.random()<0.02)dir=ex.Vector.fromAngle(Math.random()*Math.PI*2).scale(30);
vill.vel=dir;
seedTimer+=evt.delta;
if(seedTimer>2000){seedTimer=0;let gx=Math.floor(vill.pos.x),gy=Math.floor(vill.pos.y);if(ca.sample(gx,gy+1)===ca.Materials.SOIL)ca.paint(gx,gy+1,ca.Materials.SEED,1);}
});
engine.add(vill);
engine.on('postupdate',evt=>{fps=1000/evt.delta});
engine.start();
return engine;
}
function getEngine(){return engine}
function getFps(){return fps}
window.game={initGame,getEngine,getFps};
})();
