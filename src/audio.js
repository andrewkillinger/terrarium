(function(){
let click,plop,ambient,rain,pad;
function player(url,loop){try{const p=new Tone.Player({url,loop,autostart:false}).toDestination();p.on('error',()=>{});return p;}catch(e){return null;}}
function initAudio(a){pad=new Tone.PolySynth().toDestination();pad.volume.value=-24;pad.triggerAttackRelease(['C4','E4','G4'],'2n');
ambient=player(a.ambient.day,true);if(ambient)ambient.start();
rain=player(a.weather.rain,true);
click=player(a.sfx.click,false);
plop=player(a.sfx.plop,false);
}
function playClick(){if(click)click.start();else pad.triggerAttackRelease('C5','8n');}
function playPlop(){if(plop)plop.start();else pad.triggerAttackRelease('G4','8n');}
window.initAudio=initAudio;window.playClick=playClick;window.playPlop=playPlop;
})();
