import type { AnimationState } from '@/types'

export class AnimationSystem {
  private queue: AnimationState[] = []

  addAnimation(anim: AnimationState): void {
    this.queue.push({ ...anim, progress: 0 })
  }

  update(dt: number): void {
    for (const anim of this.queue) {
      anim.progress += dt / anim.duration
      if (anim.progress > 1) {
        anim.progress = 1
      }
    }
    this.queue = this.queue.filter((a) => a.progress < 1)
  }

  isComplete(): boolean {
    return this.queue.length === 0
  }

  getAnimations(): AnimationState[] {
    return this.queue
  }

  clear(): void {
    this.queue = []
  }
}
