import { createComponentKey } from '@/core/ecs/World';

export interface RenderLabel {
  text: string;
  size?: number;
  color?: number;
}

export const RenderLabelKey = createComponentKey<RenderLabel>('RenderLabel');
