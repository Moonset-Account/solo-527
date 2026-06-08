import { Tween, TweenOptions } from './tween';

class AnimationController {
  private tweens: Tween[] = [];
  private frameId: number = 0;
  private active: boolean = false;

  start(): void {
    if (this.active) return;
    this.active = true;
    this.tick(performance.now());
  }

  stop(): void {
    this.active = false;
    if (this.frameId) cancelAnimationFrame(this.frameId);
  }

  private tick = (time: number): void => {
    if (!this.active) return;
    this.tweens = this.tweens.filter(tw => tw.update(time));
    this.frameId = requestAnimationFrame(this.tick);
  };

  addTween(options: TweenOptions): Tween {
    const tw = new Tween(options);
    tw.start();
    this.tweens.push(tw);
    if (!this.active) this.start();
    return tw;
  }

  removeTween(tw: Tween): void {
    tw.stop();
    this.tweens = this.tweens.filter(t => t !== tw);
  }

  clearAll(): void {
    this.tweens.forEach(tw => tw.stop());
    this.tweens = [];
  }

  isActive(): boolean {
    return this.active;
  }
}

export const animationController = new AnimationController();
