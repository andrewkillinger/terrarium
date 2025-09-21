import { eventBus } from '@/core/services/EventBus';
import type { CoreEvents, TimeTickPayload } from '@/core/types';

export class DebugOverlay {
  private readonly container: HTMLDivElement;
  private readonly metrics: HTMLDivElement;
  private visible = false;
  private readonly unsubscribes: Array<() => void> = [];

  constructor(private readonly bus = eventBus) {
    this.container = document.createElement('div');
    this.container.className = 'debug-overlay';
    this.container.innerHTML = `
      <h1>Terrarium Debug</h1>
      <p>Press D to toggle overlay</p>
    `;

    this.metrics = document.createElement('div');
    this.metrics.className = 'debug-overlay__metrics';
    this.container.appendChild(this.metrics);

    document.body.appendChild(this.container);

    this.unsubscribes.push(
      this.bus.on('debug:toggle', (visible) => this.toggle(visible)),
      this.bus.on('time:tick', (payload) => this.updateMetrics(payload)),
    );
  }

  isVisible(): boolean {
    return this.visible;
  }

  toggle(visible?: CoreEvents['debug:toggle']): void {
    const nextVisible = typeof visible === 'boolean' ? visible : !this.visible;
    this.visible = nextVisible;
    this.container.classList.toggle('is-visible', this.visible);
  }

  destroy(): void {
    this.unsubscribes.forEach((unsubscribe) => unsubscribe());
    this.container.remove();
  }

  private updateMetrics(payload: TimeTickPayload): void {
    this.metrics.innerHTML = '';

    const delta = document.createElement('span');
    delta.textContent = `Δ ${payload.delta.toFixed(2)}ms`;

    const elapsed = document.createElement('span');
    elapsed.textContent = `Elapsed ${(payload.elapsed / 1000).toFixed(2)}s`;

    const fps = document.createElement('span');
    fps.textContent = `FPS ${payload.fps.toFixed(0)}`;

    this.metrics.append(delta, elapsed, fps);
  }
}
