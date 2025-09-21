import Phaser from 'phaser';

import { GameConfig } from '@/game/GameConfig';
import { DebugOverlay } from '@/ui/overlay/DebugOverlay';
import { eventBus } from '@/core/services/EventBus';

import '@/styles/index.css';

const game = new Phaser.Game(GameConfig);
const debugOverlay = new DebugOverlay();

declare global {
  interface Window {
    terrariumGame?: Phaser.Game;
  }
}

window.terrariumGame = game;

window.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key.toLowerCase() === 'd') {
    eventBus.emit('debug:toggle', undefined);
  }
});

window.addEventListener('beforeunload', () => {
  debugOverlay.destroy();
  window.terrariumGame?.destroy(true);
});

export { game };
