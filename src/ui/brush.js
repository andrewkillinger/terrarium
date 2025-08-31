export function setupBrushUI(container, grid, app) {
  const brushes = ['SAND', 'WATER', 'STONE', 'FIRE'];
  let current = brushes[0];
  brushes.forEach(b => {
    const btn = document.createElement('button');
    btn.textContent = b;
    btn.addEventListener('click', () => current = b);
    container.appendChild(btn);
  });
  function paint(e) {
    const rect = app.view.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (rect.width / grid.width));
    const y = Math.floor((e.clientY - rect.top) / (rect.height / grid.height));
    grid.set(x, y, current);
  }
  app.view.addEventListener('pointerdown', paint);
  app.view.addEventListener('pointermove', e => { if (e.buttons) paint(e); });
  return () => current;
}
