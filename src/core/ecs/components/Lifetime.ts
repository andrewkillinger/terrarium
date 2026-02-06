import { createComponentKey } from '@/core/ecs/World';

export interface Lifetime {
  ticksToLive: number;
}

export const LifetimeKey = createComponentKey<Lifetime>('Lifetime');
