import Phaser from 'phaser';

import { GameConfig } from '@/game/GameConfig';
import { DevPanel } from '@/ui/overlay/DevPanel';

import '@/styles/index.css';

const game = new Phaser.Game(GameConfig);
const devPanel = import.meta.env.DEV ? new DevPanel() : null;

declare global {
  interface Window {
    terrariumGame?: Phaser.Game;
  }
}

window.terrariumGame = game;

window.addEventListener('beforeunload', () => {
  devPanel?.destroy();
  window.terrariumGame?.destroy(true);
});

export { game };
