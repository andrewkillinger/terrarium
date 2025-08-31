(function(){
let players={},started=false,synth;
function initAudio(man){
for(const k in man.audio){try{players[k]=new Tone.Player(man.audio[k]).toDestination();}catch(e){}}
function start(){if(started)return;started=true;Tone.start();synth=new Tone.Synth({oscillator:{type:'triangle'}}).toDestination();const filt=new Tone.Filter(800,'lowpass').toDestination();new Tone.Oscillator('C4','triangle').connect(filt).start();new Tone.Oscillator('E4','triangle').connect(filt).start();if(players['ambient.day']){players['ambient.day'].loop=true;players['ambient.day'].start();}if(players['weather.rain']){players['weather.rain'].loop=true;players['weather.rain'].volume.value=-Infinity;players['weather.rain'].start();}Tone.Transport.start();}
window.addEventListener('pointerdown',start,{once:true});
}
function updateAudio(stats){if(players['weather.rain']){let t=stats.water>200?0:-Infinity;players['weather.rain'].volume.rampTo(t,1);}}
function playClick(){if(players['ui.click'])players['ui.click'].start();else synth&&synth.triggerAttackRelease('C5','16n');}
function playPlop(){if(players['sfx.plop'])players['sfx.plop'].start();else synth&&synth.triggerAttackRelease('C2','16n');}
window.audio={initAudio,updateAudio,playClick,playPlop};
})();
