import Phaser from 'phaser';

import { DEBUG_SPRITE_KEY, SCENES } from '@/core/config';
import { assetService } from '@/core/services/AssetService';
import { manifestService } from '@/core/services/ManifestService';

export class GamePreload extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  preload(): void {
    this.load.setCORS(manifestService.getCrossOrigin());
    this.load.image(DEBUG_SPRITE_KEY, assetService.placeholderPixel());

    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.scene.start(SCENES.PLAY);
    });
  }
}
