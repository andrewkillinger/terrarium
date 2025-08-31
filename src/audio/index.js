export class AudioManager {
  constructor(manifest) {
    this.ambient = new Howl({ src: [manifest.ambient[0]], loop: true, volume: 0.5 });
    this.rain = new Howl({ src: [manifest.loops[0]], loop: true, volume: 0 });
    this.started = false;
  }
  start() {
    if (this.started) return;
    this.started = true;
    this.ambient.play();
  }
  update(waterCount) {
    if (!this.started) return;
    if (waterCount > 20 && !this.rain.playing()) {
      this.rain.fade(0, 0.3, 2000).play();
    } else if (waterCount <= 20 && this.rain.playing()) {
      this.rain.fade(this.rain.volume(), 0, 2000);
    }
  }
}
