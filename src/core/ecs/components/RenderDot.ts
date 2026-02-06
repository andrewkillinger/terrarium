import { createComponentKey } from '@/core/ecs/World';

export interface RenderDot {
  radius: number;
  color?: number;
}

export const RenderDotKey = createComponentKey<RenderDot>('RenderDot');
