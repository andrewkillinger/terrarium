import { setCell, CellType } from './ca.js';

let current = CellType.SAND;
let brushSize = 4;
const brushSizes = [2, 4, 8];
let brushIndex = brushSizes.indexOf(brushSize);

// create UI buttons for selecting the active element
function makeButton(name, type) {
  const btn = document.createElement('button');
  btn.textContent = name;
  btn.addEventListener('click', () => {
    current = type;
    document.querySelectorAll('#palette button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
  if (type === current) btn.classList.add('active');
  return btn;
}

function makeBrushToggle() {
  const btn = document.createElement('button');
  btn.style.borderRadius = '50%';

  function applySize() {
    const size = brushSizes[brushIndex];
    brushSize = size;
    const d = size * 8; // doubled visual size
    btn.style.width = `${d}px`;
    btn.style.height = `${d}px`;
  }

  btn.addEventListener('click', () => {
    brushIndex = (brushIndex + 1) % brushSizes.length;
    applySize();
  });

  applySize();
  return btn;
}

export function initGame(container) {
  // palette on the right similar to sandspiel
  const palette = document.createElement('div');
  palette.id = 'palette';
  palette.appendChild(makeButton('Sand', CellType.SAND));
  palette.appendChild(makeButton('Water', CellType.WATER));
  palette.appendChild(makeButton('Erase', CellType.EMPTY));

  const brushes = document.createElement('div');
  brushes.id = 'brushes';
  brushes.appendChild(makeBrushToggle());

  container.appendChild(brushes);
  container.appendChild(palette);

  const canvas = document.getElementById('ca');
  if (!canvas) return;
  let drawing = false;
  let last = null;

  function setPos(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));
    last = { x, y };
  }

  function paint() {
    if (!drawing || !last) return;
    const { x, y } = last;
    const size = brushSize;
    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size; dx <= size; dx++) {
        if (dx * dx + dy * dy <= size * size) {
          setCell(x + dx, y + dy, current);
        }
      }
    }
  }

  function loop() {
    paint();
    requestAnimationFrame(loop);
  }
  loop();

  canvas.addEventListener('mousedown', e => { drawing = true; setPos(e); paint(); });
  canvas.addEventListener('mousemove', e => { setPos(e); });
  window.addEventListener('mouseup', () => { drawing = false; last = null; });

  canvas.addEventListener('touchstart', e => {
    drawing = true;
    e.preventDefault();
    setPos(e.touches[0]);
    paint();
  });
  canvas.addEventListener('touchmove', e => {
    if (!drawing) return;
    e.preventDefault();
    setPos(e.touches[0]);
  });
  window.addEventListener('touchend', () => { drawing = false; last = null; });
}

export function updateGame() {
  // no-op for now
}

