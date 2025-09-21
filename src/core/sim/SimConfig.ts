import { MS_PER_TICK } from '@/core/sim/Units';

export interface SimConfig {
  /** Fixed number of milliseconds simulated per tick. */
  tickDurationMs: number;
  /** Placeholder baseline growth energy per tick. */
  growthEnergyPerTick: number;
  /** Placeholder baseline decay energy per tick. */
  decayEnergyPerTick: number;
  /** Placeholder baseline light gathered per tick. */
  lightPerTick: number;
}

export const DEFAULT_SIM_CONFIG: SimConfig = {
  tickDurationMs: MS_PER_TICK,
  growthEnergyPerTick: 1,
  decayEnergyPerTick: 1,
  lightPerTick: 1,
};
