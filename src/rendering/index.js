export function createApp(width = 512, height = 288) {
  return new PIXI.Application({ width, height, background: 0x2c2c2c, resolution: window.devicePixelRatio || 1 });
}
