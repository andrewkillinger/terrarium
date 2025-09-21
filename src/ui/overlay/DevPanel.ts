import { eventBus } from '@/core/services/EventBus';
import { profiling } from '@/core/services/Profiling';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '@/core/config';
import { queueDespawnAll, queueSpawn } from '@/game/systems/Spawning';
import type Phaser from 'phaser';
import type { ProfilingService } from '@/core/services/Profiling';
import type { CoreEvents } from '@/core/types';

type ButtonKey =
  | 'pause'
  | 'play'
  | 'step'
  | 'reset'
  | 'spawnDot'
  | 'spawnLabel'
  | 'clearAll';

export class DevPanel {
  private readonly container: HTMLDivElement;
  private readonly stats: HTMLDivElement;
  private readonly timings: HTMLUListElement;
  private readonly buttons: Record<ButtonKey, HTMLButtonElement>;
  private readonly unsubscribes: Array<() => void> = [];
  private visible = false;
  private paused = false;

  constructor(
    private readonly bus = eventBus,
    private readonly profiler: ProfilingService = profiling,
  ) {
    this.container = document.createElement('div');
    this.container.className = 'dev-panel';

    this.stats = document.createElement('div');
    this.stats.className = 'dev-panel__stats';
    this.stats.textContent = 'Sim — tick: 0 | time: 0.0s | dt: 0ms';

    this.timings = document.createElement('ul');
    this.timings.className = 'dev-panel__timings';

    const simControls = document.createElement('div');
    simControls.className = 'dev-panel__controls';

    const spawnControls = document.createElement('div');
    spawnControls.className = 'dev-panel__controls';

    this.buttons = {
      pause: this.createButton('Pause', () => this.emitCommand('pause')),
      play: this.createButton('Play', () => this.emitCommand('resume')),
      step: this.createButton('Step', () => this.emitCommand('step')),
      reset: this.createButton('Reset', () => this.emitCommand('reset')),
      spawnDot: this.createButton('Spawn Dot', () => this.spawnDot()),
      spawnLabel: this.createButton('Spawn Label', () => this.spawnLabel()),
      clearAll: this.createButton('Clear All', () => this.clearAll()),
    };

    simControls.append(
      this.buttons.pause,
      this.buttons.play,
      this.buttons.step,
      this.buttons.reset,
    );
    spawnControls.append(
      this.buttons.spawnDot,
      this.buttons.spawnLabel,
      this.buttons.clearAll,
    );

    this.container.append(this.stats, simControls, spawnControls, this.timings);
    document.body.appendChild(this.container);

    this.unsubscribes.push(
      this.bus.on('devpanel:toggle', (visible) => this.toggle(visible)),
      this.bus.on('sim:tick', (payload) => this.updateTick(payload)),
      this.bus.on('sim:state', (payload) => this.updateState(payload)),
    );

    this.updateControls();
  }

  destroy(): void {
    this.unsubscribes.forEach((unsubscribe) => unsubscribe());
    this.container.remove();
  }

  private toggle(visible?: CoreEvents['devpanel:toggle']): void {
    const nextVisible = typeof visible === 'boolean' ? visible : !this.visible;
    this.visible = nextVisible;
    this.container.classList.toggle('is-visible', this.visible);
  }

  private updateTick(payload: CoreEvents['sim:tick']): void {
    const seconds = (payload.elapsedMs / 1000).toFixed(2);
    this.stats.textContent = `Sim — tick: ${payload.tick} | time: ${seconds}s | dt: ${payload.deltaMs}ms`;
    this.updateTimings();
  }

  private updateState(payload: CoreEvents['sim:state']): void {
    this.paused = payload.paused;
    this.updateControls();
  }

  private updateControls(): void {
    this.buttons.pause.disabled = this.paused;
    this.buttons.play.disabled = !this.paused;
    this.buttons.step.disabled = !this.paused;
  }

  private spawnDot(): void {
    const { x, y } = this.getSpawnCoordinates();
    queueSpawn({ kind: 'dot', x, y, radius: 3, color: 0x00ff88 });
  }

  private spawnLabel(): void {
    const { x, y } = this.getSpawnCoordinates();
    queueSpawn({ kind: 'label', x, y, text: 'hello', size: 8, color: 0xffff00 });
  }

  private clearAll(): void {
    queueDespawnAll();
  }

  private getSpawnCoordinates(): { x: number; y: number } {
    const scene = this.getPlayScene();

    if (scene) {
      const pointer = scene.input?.activePointer;
      const pointerX = pointer?.worldX;
      const pointerY = pointer?.worldY;

      if (Number.isFinite(pointerX) && Number.isFinite(pointerY)) {
        return { x: Math.round(pointerX!), y: Math.round(pointerY!) };
      }

      const camera = scene.cameras?.main;
      if (camera) {
        const midPoint = camera.midPoint;
        return { x: Math.round(midPoint.x), y: Math.round(midPoint.y) };
      }
    }

    return { x: Math.round(GAME_WIDTH / 2), y: Math.round(GAME_HEIGHT / 2) };
  }

  private getPlayScene(): Phaser.Scene | undefined {
    const game = window.terrariumGame;
    if (!game) {
      return undefined;
    }

    const sceneManager = game.scene;
    if (!sceneManager.isActive?.(SCENES.PLAY)) {
      return undefined;
    }

    const scene = sceneManager.getScene(SCENES.PLAY) as Phaser.Scene | undefined;
    return scene ?? undefined;
  }

  private updateTimings(): void {
    const snapshot = this.profiler.getSnapshot();
    this.timings.innerHTML = '';

    if (snapshot.systems.length === 0) {
      const item = document.createElement('li');
      item.textContent = 'No systems profiled';
      this.timings.appendChild(item);
      return;
    }

    const totalLabel = document.createElement('li');
    totalLabel.textContent = `Total ${snapshot.totalMs.toFixed(3)}ms`;
    totalLabel.className = 'dev-panel__timings-total';
    this.timings.appendChild(totalLabel);

    snapshot.systems.forEach((entry) => {
      const item = document.createElement('li');
      item.textContent = `${entry.name} — ${entry.durationMs.toFixed(3)}ms`;
      this.timings.appendChild(item);
    });
  }

  private emitCommand(action: CoreEvents['sim:command']['action']): void {
    this.bus.emit('sim:command', { action });
  }

  private createButton(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }
}
