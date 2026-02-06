import type { System } from '@/core/ecs/System';

const lifecycleSystem: System = ((_dt, _world) => {
  // Placeholder lifecycle system. Species-specific logic will be added later.
}) as System;
lifecycleSystem.displayName = 'Sim::Lifecycle';

const metabolismSystem: System = ((_dt, _world) => {
  // Placeholder metabolism system.
}) as System;
metabolismSystem.displayName = 'Sim::Metabolism';

export const SIM_SYSTEMS: System[] = [lifecycleSystem, metabolismSystem];
