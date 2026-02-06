import { createComponentKey } from '@/core/ecs/World';

export interface Position {
  x: number;
  y: number;
}

export const PositionKey = createComponentKey<Position>('Position');
