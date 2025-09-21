/**
 * Shared simulation unit references.
 *
 * These values define the base scalar units used throughout the Terrarium
 * simulation. Concrete species, processes, and balancing will derive from
 * these references in later phases. For now they serve as documentation for
 * the fixed-step simulation loop.
 */

/** Milliseconds advanced per fixed simulation tick. */
export const MS_PER_TICK = 100;

/**
 * Baseline metabolic energy unit. Future species will consume and generate
 * energy in integer multiples of this constant.
 */
export const ENERGY_UNIT = 1;

/**
 * Baseline illumination unit for photosynthesis and diurnal cycles.
 */
export const LIGHT_UNIT = 1;
