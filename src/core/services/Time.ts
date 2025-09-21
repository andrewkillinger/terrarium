import { eventBus } from '@/core/services/EventBus';
import type { CoreEvents, TimeTickPayload } from '@/core/types';
import type { EventBus } from '@/core/services/EventBus';

export class Time {
  private accumulator = 0;
  private elapsed = 0;

  constructor(
    private readonly fixedStepMs = 1000 / 60,
    private readonly bus: EventBus<CoreEvents> = eventBus,
  ) {}

  update(deltaMs: number): void {
    if (!Number.isFinite(deltaMs)) {
      return;
    }

    this.accumulator += deltaMs;

    while (this.accumulator >= this.fixedStepMs) {
      this.accumulator -= this.fixedStepMs;
      this.elapsed += this.fixedStepMs;
      this.emitTick({
        delta: this.fixedStepMs,
        elapsed: this.elapsed,
        fixedStep: this.fixedStepMs,
        fps: Math.round(1000 / this.fixedStepMs),
      });
    }
  }

  reset(): void {
    this.accumulator = 0;
    this.elapsed = 0;
  }

  get elapsedMs(): number {
    return this.elapsed;
  }

  get fixedStep(): number {
    return this.fixedStepMs;
  }

  private emitTick(payload: TimeTickPayload): void {
    this.bus.emit('time:tick', payload);
  }
}

export const time = new Time();
