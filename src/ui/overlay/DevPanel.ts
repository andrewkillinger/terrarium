import { profiling } from '@/core/services/Profiling';
import { eventBus } from '@/core/services/EventBus';
import type { ProfilingService } from '@/core/services/Profiling';
import type { CoreEvents } from '@/core/types';

export class DevPanel {
  private readonly container: HTMLDivElement;
  private readonly stats: HTMLDivElement;
  private readonly timings: HTMLUListElement;
  private readonly buttons: Record<'pause' | 'play' | 'step' | 'reset', HTMLButtonElement>;
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

    const controls = document.createElement('div');
    controls.className = 'dev-panel__controls';

    this.buttons = {
      pause: this.createButton('Pause', () => this.emitCommand('pause')),
      play: this.createButton('Play', () => this.emitCommand('resume')),
      step: this.createButton('Step', () => this.emitCommand('step')),
      reset: this.createButton('Reset', () => this.emitCommand('reset')),
    };

    controls.append(this.buttons.pause, this.buttons.play, this.buttons.step, this.buttons.reset);

    this.container.append(this.stats, controls, this.timings);
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
