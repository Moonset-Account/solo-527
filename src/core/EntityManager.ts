import type { IGameEntity, IDisposable } from '@/types';

export class EntityManager implements IDisposable {
  private entities: Map<string, IGameEntity> = new Map();

  add<T extends IGameEntity>(entity: T): T {
    this.entities.set(entity.id, entity);
    return entity;
  }

  remove(id: string): void {
    const e = this.entities.get(id);
    if (e) {
      e.alive = false;
      e.dispose();
      this.entities.delete(id);
    }
  }

  get<T extends IGameEntity>(id: string): T | undefined {
    return this.entities.get(id) as T | undefined;
  }

  getAll<T extends IGameEntity>(): T[] {
    return Array.from(this.entities.values()) as T[];
  }

  update(dt: number): void {
    this.entities.forEach((e) => {
      if (e.alive) {
        try {
          e.update(dt);
        } catch (err) {
          console.error(`[EntityManager] Error updating ${e.id}:`, err);
        }
      }
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.entities.forEach((e) => {
      if (e.alive) {
        try {
          e.render(ctx);
        } catch (err) {
          console.error(`[EntityManager] Error rendering ${e.id}:`, err);
        }
      }
    });
  }

  cleanup(): number {
    let removed = 0;
    this.entities.forEach((e, id) => {
      if (!e.alive) {
        e.dispose();
        this.entities.delete(id);
        removed++;
      }
    });
    return removed;
  }

  count(): number {
    return this.entities.size;
  }

  clear(): void {
    this.entities.forEach((e) => e.dispose());
    this.entities.clear();
  }

  dispose(): void {
    this.clear();
  }
}
