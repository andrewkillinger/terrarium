import { eventBus } from '@/core/services/EventBus';
import type { EventBus } from '@/core/services/EventBus';
import type { CoreEvents, SimStatePayload, SimTickPayload } from '@/core/types';

export interface SimClockOptions {
  fixedDeltaMs?: number;
  maxStepsPerFrame?: number;
}

type StepHandler = (dtFixedMs: number) => void;

export class SimClock {
  private accumulator = 0;
  private elapsedMs = 0;
  private tickCount = 0;
  private paused = false;

  private readonly fixedDeltaMs: number;
  private readonly maxStepsPerFrame: number;
  private readonly stepHandler: StepHandler;
  private readonly bus: EventBus<CoreEvents>;

  constructor(
    stepHandler: StepHandler,
    options: SimClockOptions = {},
    bus: EventBus<CoreEvents> = eventBus,
  ) {
    this.stepHandler = stepHandler;
    this.fixedDeltaMs = options.fixedDeltaMs ?? 100;
    this.maxStepsPerFrame = options.maxStepsPerFrame ?? 5;
    this.bus = bus;
  }

  advance(deltaMs: number): number {
    if (this.paused) {
      return 0;
    }

    if (!Number.isFinite(deltaMs)) {
      return 0;
    }

    this.accumulator += deltaMs;
    let steps = 0;

    while (this.accumulator >= this.fixedDeltaMs && steps < this.maxStepsPerFrame) {
      this.accumulator -= this.fixedDeltaMs;
      this.executeStep();
      steps += 1;
    }

    if (steps === this.maxStepsPerFrame && this.accumulator >= this.fixedDeltaMs) {
      // Avoid spiralling by discarding the remainder when the simulation cannot catch up.
      this.accumulator = 0;
    }

    return steps;
  }

  pause(): void {
    if (this.paused) {
      return;
    }

    this.paused = true;
    this.emitState();
  }

  resume(): void {
    if (!this.paused) {
      return;
    }

    this.paused = false;
    this.emitState();
  }

  toggle(): void {
    if (this.paused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  stepOnce(): void {
    this.executeStep();
  }

  reset(): void {
    this.accumulator = 0;
    this.elapsedMs = 0;
    this.tickCount = 0;
    this.emitState();
    this.emitTick(0);
  }

  get tick(): number {
    return this.tickCount;
  }

  get time(): number {
    return this.elapsedMs;
  }

  get delta(): number {
    return this.fixedDeltaMs;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  private executeStep(): void {
    this.tickCount += 1;
    this.elapsedMs += this.fixedDeltaMs;
    this.stepHandler(this.fixedDeltaMs);
    this.emitTick(this.fixedDeltaMs);
  }

  private emitTick(deltaMs: number): void {
    const payload: SimTickPayload = {
      tick: this.tickCount,
      elapsedMs: this.elapsedMs,
      deltaMs,
    };
    this.bus.emit('sim:tick', payload);
  }

  private emitState(): void {
    const payload: SimStatePayload = {
      tick: this.tickCount,
      elapsedMs: this.elapsedMs,
      paused: this.paused,
    };
    this.bus.emit('sim:state', payload);
  }
}
