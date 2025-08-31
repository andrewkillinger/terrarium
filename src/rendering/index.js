import { Application } from 'pixi.js';
import { AdjustmentFilter } from '@pixi/filter-adjustment';
import { AdvancedBloomFilter } from '@pixi/filter-advanced-bloom';

export function initRenderer() {
  const app = new Application({
    width: 512,
    height: 288,
    background: 0x222222,
  });
  document.body.appendChild(app.view);

  const resize = () => {
    const scale = Math.min(window.innerWidth / 512, window.innerHeight / 288);
    app.view.style.width = 512 * scale + 'px';
    app.view.style.height = 288 * scale + 'px';
  };
  window.addEventListener('resize', resize);
  resize();

  const adj = new AdjustmentFilter({ gamma: 1.05 });
  const bloom = new AdvancedBloomFilter();
  app.stage.filters = [adj, bloom];

  return app;
}
