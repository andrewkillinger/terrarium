import Phaser from 'phaser';

import { DEBUG_SPRITE_KEY, GAME_HEIGHT, GAME_WIDTH, SCENES } from '@/core/config';
import { eventBus } from '@/core/services/EventBus';
import { time } from '@/core/services/Time';

export class GamePlay extends Phaser.Scene {
  private debugKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super(SCENES.PLAY);
  }

  create(): void {
    const sprite = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 12, DEBUG_SPRITE_KEY);
    sprite.setOrigin(0.5);
    sprite.setScale(16);

    const headline = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 32, 'Terrarium Engine Ready', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#f0f6fc',
      align: 'center',
    });
    headline.setOrigin(0.5);
    headline.setResolution(2);

    const instructions = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 16,
      'Press D to toggle debug overlay',
      {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#a0aec0',
        align: 'center',
      },
    );
    instructions.setOrigin(0.5);
    instructions.setResolution(2);

    this.debugKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.debugKey?.destroy();
    });
  }

  update(_time: number, delta: number): void {
    if (this.debugKey && Phaser.Input.Keyboard.JustDown(this.debugKey)) {
      eventBus.emit('debug:toggle', undefined);
    }

    time.update(delta);
  }
}
