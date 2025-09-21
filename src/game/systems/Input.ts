import Phaser from 'phaser';

import { eventBus } from '@/core/services/EventBus';

export function setupInput(scene: Phaser.Scene): void {
  if (!scene.input.keyboard || !import.meta.env.DEV) {
    return;
  }

  const toggleKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKTICK);

  const handleUpdate = () => {
    if (Phaser.Input.Keyboard.JustDown(toggleKey)) {
      eventBus.emit('devpanel:toggle', undefined);
    }
  };

  scene.events.on(Phaser.Scenes.Events.UPDATE, handleUpdate);

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, handleUpdate);
    toggleKey.destroy();
  });
}
