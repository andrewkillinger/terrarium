export function initRenderer() {
  const app = new PIXI.Application({
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

  const filters = PIXI.filters || {};
  const fx = [];
  if (filters.AdjustmentFilter) fx.push(new filters.AdjustmentFilter({ gamma: 1.05 }));
  if (filters.AdvancedBloomFilter) fx.push(new filters.AdvancedBloomFilter());
  app.stage.filters = fx;

  return app;
}
