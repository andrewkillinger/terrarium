import Phaser from 'phaser';

import { DEBUG_SPRITE_KEY, DEBUG_SPRITE_PATH, SCENES } from '@/core/config';
import { assetService } from '@/core/services/AssetService';

export class GamePreload extends Phaser.Scene {
  private fallbackLoaded = false;

  constructor() {
    super(SCENES.PRELOAD);
  }

  preload(): void {
    this.load.setCORS('anonymous');
    this.load.image(DEBUG_SPRITE_KEY, assetService.resolve(DEBUG_SPRITE_PATH));

    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.scene.start(SCENES.PLAY);
    });

    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      if (file.key === DEBUG_SPRITE_KEY && !this.fallbackLoaded) {
        this.fallbackLoaded = true;
        this.load.image(DEBUG_SPRITE_KEY, assetService.placeholderPixel());
        this.load.start();
      }
    });
  }
}
