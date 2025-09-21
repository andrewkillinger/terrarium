import type { World } from '@/core/ecs/World';

export type System = ((dtFixedMs: number, world: World) => void) & {
  displayName?: string;
};
