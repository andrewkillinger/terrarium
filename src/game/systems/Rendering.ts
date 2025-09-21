import Phaser from 'phaser';

import type { ComponentStore } from '@/core/ecs/ComponentStore';
import type { EntityId } from '@/core/ecs/EntityId';
import type { World } from '@/core/ecs/World';
import type { Position } from '@/core/ecs/components/Position';
import { PositionKey } from '@/core/ecs/components/Position';
import type { RenderDot } from '@/core/ecs/components/RenderDot';
import { RenderDotKey } from '@/core/ecs/components/RenderDot';
import type { RenderLabel } from '@/core/ecs/components/RenderLabel';
import { RenderLabelKey } from '@/core/ecs/components/RenderLabel';

const DEFAULT_DOT_COLOR = 0xffffff;
const DEFAULT_LABEL_COLOR = 0xffffff;

function toHexColor(value: number | undefined, fallback: number): string {
  const normalized = value ?? fallback;
  const hex = normalized.toString(16).padStart(6, '0');
  return `#${hex}`;
}

export class RenderingBridge {
  private readonly dotGraphics = new Map<EntityId, Phaser.GameObjects.Graphics>();
  private readonly labelTexts = new Map<EntityId, Phaser.GameObjects.Text>();

  constructor(private readonly scene: Phaser.Scene) {}

  sync(world: World): void {
    const positionStore = world.getComponentStore<Position>(PositionKey);
    if (!positionStore) {
      this.clear();
      return;
    }

    this.syncDots(world, positionStore);
    this.syncLabels(world, positionStore);
  }

  clear(): void {
    for (const graphics of this.dotGraphics.values()) {
      graphics.destroy();
    }
    this.dotGraphics.clear();

    for (const text of this.labelTexts.values()) {
      text.destroy();
    }
    this.labelTexts.clear();
  }

  private syncDots(world: World, positionStore: ComponentStore<Position>): void {
    const dotStore = world.getComponentStore<RenderDot>(RenderDotKey);
    const active = new Set<EntityId>();

    if (dotStore) {
      for (const [entityId, dot] of dotStore) {
        const position = positionStore.get(entityId);
        if (!position) {
          continue;
        }

        const graphics = this.getOrCreateDot(entityId);
        const x = Math.round(position.x);
        const y = Math.round(position.y);
        const radius = Math.max(0, dot.radius);

        graphics.clear();

        if (radius > 0) {
          graphics.fillStyle(dot.color ?? DEFAULT_DOT_COLOR, 1);
          graphics.fillCircle(x, y, radius);
        }

        active.add(entityId);
      }
    }

    for (const [entityId, graphics] of this.dotGraphics) {
      if (!active.has(entityId)) {
        graphics.destroy();
        this.dotGraphics.delete(entityId);
      }
    }
  }

  private syncLabels(world: World, positionStore: ComponentStore<Position>): void {
    const labelStore = world.getComponentStore<RenderLabel>(RenderLabelKey);
    const active = new Set<EntityId>();

    if (labelStore) {
      for (const [entityId, label] of labelStore) {
        const position = positionStore.get(entityId);
        if (!position) {
          continue;
        }

        const textObject = this.getOrCreateLabel(entityId);
        const x = Math.round(position.x);
        const y = Math.round(position.y);
        const size = Math.max(1, label.size ?? 8);

        textObject.setPosition(x, y);
        textObject.setText(label.text);
        textObject.setFontSize(size);
        textObject.setColor(toHexColor(label.color, DEFAULT_LABEL_COLOR));

        active.add(entityId);
      }
    }

    for (const [entityId, text] of this.labelTexts) {
      if (!active.has(entityId)) {
        text.destroy();
        this.labelTexts.delete(entityId);
      }
    }
  }

  private getOrCreateDot(entityId: EntityId): Phaser.GameObjects.Graphics {
    let graphics = this.dotGraphics.get(entityId);
    if (!graphics) {
      graphics = this.scene.add.graphics();
      graphics.setScrollFactor(1, 1);
      graphics.setDepth(10);
      this.dotGraphics.set(entityId, graphics);
    }
    return graphics;
  }

  private getOrCreateLabel(entityId: EntityId): Phaser.GameObjects.Text {
    let text = this.labelTexts.get(entityId);
    if (!text) {
      text = this.scene.add.text(0, 0, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '8px',
        color: toHexColor(undefined, DEFAULT_LABEL_COLOR),
        align: 'center',
      });
      text.setOrigin(0.5);
      text.setScrollFactor(1, 1);
      text.setDepth(11);
      text.setResolution(2);
      this.labelTexts.set(entityId, text);
    }
    return text;
  }
}
