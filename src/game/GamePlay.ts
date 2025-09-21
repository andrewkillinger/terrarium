import Phaser from 'phaser';

import { DEBUG_SPRITE_KEY, GAME_HEIGHT, GAME_WIDTH, SCENES } from '@/core/config';
import { World } from '@/core/ecs/World';
import { SimClock } from '@/core/sim/SimClock';
import { MS_PER_TICK } from '@/core/sim/Units';
import { profiling } from '@/core/services/Profiling';
import { eventBus } from '@/core/services/EventBus';
import type { CoreEvents } from '@/core/types';
import { SIM_SYSTEMS } from '@/game/systems/Simulation';
import { setupInput } from '@/game/systems/Input';
import { RenderingBridge } from '@/game/systems/Rendering';
import { spawningSystem } from '@/game/systems/Spawning';
import { garbageCollectSystem } from '@/game/systems/GarbageCollect';
import { PositionKey } from '@/core/ecs/components/Position';
import { RenderDotKey } from '@/core/ecs/components/RenderDot';
import { RenderLabelKey } from '@/core/ecs/components/RenderLabel';
import { LifetimeKey } from '@/core/ecs/components/Lifetime';

export class GamePlay extends Phaser.Scene {
  private world!: World;
  private clock!: SimClock;
  private rendering!: RenderingBridge;
  private unsubscribeCommand?: () => void;

  constructor() {
    super(SCENES.PLAY);
  }

  create(): void {
    this.cameras.main.setRoundPixels(true);

    const sprite = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 12, DEBUG_SPRITE_KEY);
    sprite.setOrigin(0.5);
    sprite.setScale(16);

    const headline = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 32, 'Simulation Spine Online', {
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
      'Press ` to toggle dev panel',
      {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#a0aec0',
        align: 'center',
      },
    );
    instructions.setOrigin(0.5);
    instructions.setResolution(2);

    this.world = new World();
    this.rendering = new RenderingBridge(this);

    this.world.registerComponentStore(PositionKey);
    this.world.registerComponentStore(RenderDotKey);
    this.world.registerComponentStore(RenderLabelKey);
    this.world.registerComponentStore(LifetimeKey);

    this.world.addSystem(spawningSystem);
    SIM_SYSTEMS.forEach((system) => this.world.addSystem(system));
    this.world.addSystem(garbageCollectSystem);

    this.clock = new SimClock((dt) => this.stepSimulation(dt), {
      fixedDeltaMs: MS_PER_TICK,
      maxStepsPerFrame: 8,
    });
    this.clock.reset();

    this.unsubscribeCommand = eventBus.on('sim:command', (payload) => this.handleCommand(payload));

    setupInput(this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeCommand?.();
    });
  }

  update(_time: number, delta: number): void {
    this.clock.advance(delta);
  }

  private stepSimulation(dt: number): void {
    if (import.meta.env.DEV) {
      for (const system of this.world.getSystems()) {
        const name = system.displayName ?? system.name ?? 'System';
        profiling.measure(name, () => {
          system(dt, this.world);
        });
      }
      profiling.commit();
    } else {
      this.world.step(dt);
    }

    this.rendering.sync(this.world);
  }

  private handleCommand(payload: CoreEvents['sim:command']): void {
    switch (payload.action) {
      case 'pause':
        this.clock.pause();
        break;
      case 'resume':
        this.clock.resume();
        break;
      case 'step':
        this.clock.stepOnce();
        break;
      case 'reset':
        this.resetWorld();
        break;
      default:
        break;
    }
  }

  private resetWorld(): void {
    this.world.clearEntities();
    this.rendering.clear();
    if (import.meta.env.DEV) {
      profiling.reset();
      profiling.commit();
    }
    this.clock.reset();
  }
}
