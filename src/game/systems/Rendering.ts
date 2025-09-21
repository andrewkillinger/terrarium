import type Phaser from 'phaser';

import type { World } from '@/core/ecs/World';

export class RenderingBridge {
  constructor(private readonly scene: Phaser.Scene) {}

  sync(world: World): void {
    void world;
    // Rendering bridge placeholder. Future phases will synchronize ECS state
    // with Phaser display objects here.
  }
}
