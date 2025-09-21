const now = (): number => {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }

  return Date.now();
};

export interface SystemTiming {
  name: string;
  durationMs: number;
}

export interface ProfilingSnapshot {
  totalMs: number;
  systems: SystemTiming[];
}

export class ProfilingService {
  private readonly frameTimings = new Map<string, number>();
  private snapshot: ProfilingSnapshot = { totalMs: 0, systems: [] };

  measure<T>(name: string, fn: () => T): T {
    const start = now();
    try {
      return fn();
    } finally {
      const duration = now() - start;
      this.addTiming(name, duration);
    }
  }

  addTiming(name: string, durationMs: number): void {
    const current = this.frameTimings.get(name) ?? 0;
    this.frameTimings.set(name, current + durationMs);
  }

  commit(): void {
    const systems = Array.from(this.frameTimings.entries())
      .map<SystemTiming>(([name, durationMs]) => ({ name, durationMs }))
      .sort((a, b) => b.durationMs - a.durationMs);

    const totalMs = systems.reduce((sum, entry) => sum + entry.durationMs, 0);

    this.snapshot = { systems, totalMs };
    this.frameTimings.clear();
  }

  reset(): void {
    this.frameTimings.clear();
    this.snapshot = { totalMs: 0, systems: [] };
  }

  getSnapshot(): ProfilingSnapshot {
    return this.snapshot;
  }
}

export const profiling = new ProfilingService();
