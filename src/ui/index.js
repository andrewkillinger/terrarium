export function initUI(app, grid, audio) {
  const ui = document.getElementById('ui');
  const brushes = [
    { id:1, name:'sand' },
    { id:2, name:'water' },
    { id:3, name:'stone' },
    { id:4, name:'fire' }
  ];
  let current = 1;
  brushes.forEach(b => {
    const el = document.createElement('div');
    el.textContent = b.name;
    el.className = 'brush';
    el.onclick = () => current = b.id;
    ui.appendChild(el);
  });

  function paintEvent(e) {
    const rect = app.view.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / grid.cellSize);
    const y = Math.floor((e.clientY - rect.top) / grid.cellSize);
    grid.paint(x, y, current);
    audio.sfx.play();
  }

  app.view.addEventListener('pointerdown', paintEvent);
  app.view.addEventListener('pointermove', e => { if(e.buttons) paintEvent(e); });
}
