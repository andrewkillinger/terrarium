import { setCell, CellType } from './ca.js';

let current = CellType.SAND;

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

export function initGame(container) {
  // palette on the right similar to sandspiel
  const palette = document.createElement('div');
  palette.id = 'palette';
  palette.appendChild(makeButton('Sand', CellType.SAND));
  palette.appendChild(makeButton('Water', CellType.WATER));
  palette.appendChild(makeButton('Erase', CellType.EMPTY));
  container.appendChild(palette);

  const canvas = document.getElementById('ca');
  if (!canvas) return;
  let drawing = false;

  function draw(e) {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));
    const size = 4; // simple brush size
    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size; dx <= size; dx++) {
        if (dx * dx + dy * dy <= size * size) {
          setCell(x + dx, y + dy, current);
        }
      }
    }
  }

  canvas.addEventListener('mousedown', e => { drawing = true; draw(e); });
  canvas.addEventListener('mousemove', draw);
  window.addEventListener('mouseup', () => { drawing = false; });
}

export function updateGame() {
  // no-op for now
}

