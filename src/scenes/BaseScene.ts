import { Scene } from '../core/SceneManager';
import { EventBus } from '../core/EventBus';
import { createLogger, Logger } from '../utils/logger';

export abstract class BaseScene implements Scene {
  readonly id: string;
  protected logger: Logger;
  protected eventBus: EventBus;
  protected width: number = 0;
  protected height: number = 0;

  constructor(id: string, eventBus: EventBus) {
    this.id = id;
    this.eventBus = eventBus;
    this.logger = createLogger(`Scene:${id}`);
  }

  enter(_payload?: unknown): void {}

  exit(): void {}

  update(_dt: number): void {}

  render(_ctx: CanvasRenderingContext2D): void {}

  onResize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  handleInput?(_event: unknown): void;
}
