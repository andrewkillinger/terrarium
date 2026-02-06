import Phaser from 'phaser';

import { BACKGROUND_COLOR, SCENES } from '@/core/config';
import { eventBus } from '@/core/services/EventBus';
import { storageService } from '@/core/services/StorageService';
import { manifestService } from '@/core/services/ManifestService';

export class GameBoot extends Phaser.Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  preload(): void {
    this.load.setCORS(manifestService.getCrossOrigin());
  }

  async create(): Promise<void> {
    eventBus.clear();
    await manifestService.init();
    const savedState = storageService.loadWorld();
    this.registry.set('world:state', savedState);
    this.cameras.main.setBackgroundColor(BACKGROUND_COLOR);
    this.scene.start(SCENES.PRELOAD);
  }
}
