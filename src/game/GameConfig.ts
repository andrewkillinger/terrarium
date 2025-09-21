import Phaser from 'phaser';

import { BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH, ZOOM_FACTOR } from '@/core/config';
import { GameBoot } from '@/game/GameBoot';
import { GamePreload } from '@/game/GamePreload';
import { GamePlay } from '@/game/GamePlay';

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  zoom: ZOOM_FACTOR,
  backgroundColor: BACKGROUND_COLOR,
  pixelArt: true,
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    powerPreference: 'high-performance',
  },
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [GameBoot, GamePreload, GamePlay],
};

export type TerrariumGame = Phaser.Game & { config: typeof GameConfig };
