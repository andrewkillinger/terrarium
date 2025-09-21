import Phaser from 'phaser';

import { BACKGROUND_COLOR, SCENES } from '@/core/config';

export class GameBoot extends Phaser.Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  preload(): void {
    this.load.setCORS('anonymous');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BACKGROUND_COLOR);
    this.scene.start(SCENES.PRELOAD);
  }
}
