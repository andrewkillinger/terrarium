import type { System } from '@/core/ecs/System';

const lifecycleSystem: System = ((dt, world) => {
  void dt;
  void world;
  // Placeholder lifecycle system. Species-specific logic will be added later.
}) as System;
lifecycleSystem.displayName = 'Sim::Lifecycle';

const metabolismSystem: System = ((dt, world) => {
  void dt;
  void world;
  // Placeholder metabolism system.
}) as System;
metabolismSystem.displayName = 'Sim::Metabolism';

export const SIM_SYSTEMS: System[] = [lifecycleSystem, metabolismSystem];
