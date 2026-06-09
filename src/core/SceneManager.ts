export interface Scene<TPayload = unknown> {
  readonly id: string;
  enter(payload?: TPayload): void;
  exit(): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  onResize(width: number, height: number): void;
  handleInput?(event: unknown): void;
}

export type SceneConstructor<T extends Scene = Scene> = new (...args: any[]) => T;

export interface SceneChangeInfo<TPayload = unknown> {
  fromId: string | null;
  toId: string;
  payload: TPayload | undefined;
  action: 'push' | 'pop' | 'replace';
}

export type SceneChangedCallback<TPayload = unknown> = (info: SceneChangeInfo<TPayload>) => void;

export class SceneManager {
  private scenes: Map<string, Scene> = new Map();
  private stack: Array<{ id: string; payload?: unknown }> = [];
  private onSceneChangedCallback: SceneChangedCallback | null = null;

  get currentScene(): Scene | null {
    if (this.stack.length === 0) return null;
    const top = this.stack[this.stack.length - 1];
    return this.scenes.get(top.id) ?? null;
  }

  get currentSceneId(): string | null {
    if (this.stack.length === 0) return null;
    return this.stack[this.stack.length - 1].id;
  }

  get stackDepth(): number {
    return this.stack.length;
  }

  register(scene: Scene): void {
    this.scenes.set(scene.id, scene);
  }

  unregister(id: string): boolean {
    return this.scenes.delete(id);
  }

  has(id: string): boolean {
    return this.scenes.has(id);
  }

  get(id: string): Scene | undefined {
    return this.scenes.get(id);
  }

  onSceneChanged(cb: SceneChangedCallback | null): void {
    this.onSceneChangedCallback = cb;
  }

  push<TPayload = unknown>(id: string, payload?: TPayload): void {
    if (!this.scenes.has(id)) {
      throw new Error(`Scene not registered: ${id}`);
    }
    const fromId = this.currentSceneId;
    const current = this.currentScene;
    if (current) {
      current.exit();
    }
    this.stack.push({ id, payload });
    const next = this.scenes.get(id)!;
    next.enter(payload);
    this.notifyChange(fromId, id, payload, 'push');
  }

  pop(): boolean {
    if (this.stack.length <= 1) {
      return false;
    }
    const fromId = this.currentSceneId;
    const current = this.currentScene;
    if (current) {
      current.exit();
    }
    this.stack.pop();
    const toId = this.currentSceneId!;
    const next = this.currentScene!;
    const top = this.stack[this.stack.length - 1];
    next.enter(top.payload);
    this.notifyChange(fromId, toId, top.payload, 'pop');
    return true;
  }

  replace<TPayload = unknown>(id: string, payload?: TPayload): void {
    if (!this.scenes.has(id)) {
      throw new Error(`Scene not registered: ${id}`);
    }
    const fromId = this.currentSceneId;
    const current = this.currentScene;
    if (current) {
      current.exit();
    }
    if (this.stack.length > 0) {
      this.stack[this.stack.length - 1] = { id, payload };
    } else {
      this.stack.push({ id, payload });
    }
    const next = this.scenes.get(id)!;
    next.enter(payload);
    this.notifyChange(fromId, id, payload, 'replace');
  }

  update(dt: number): void {
    const current = this.currentScene;
    if (current) {
      current.update(dt);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const current = this.currentScene;
    if (current) {
      current.render(ctx);
    }
  }

  resize(width: number, height: number): void {
    for (const scene of this.scenes.values()) {
      scene.onResize(width, height);
    }
  }

  handleInput(event: unknown): void {
    const current = this.currentScene;
    if (current && current.handleInput) {
      current.handleInput(event);
    }
  }

  clearStack(): void {
    const current = this.currentScene;
    if (current) {
      current.exit();
    }
    this.stack = [];
  }

  private notifyChange(
    fromId: string | null,
    toId: string,
    payload: unknown,
    action: SceneChangeInfo['action']
  ): void {
    if (this.onSceneChangedCallback) {
      this.onSceneChangedCallback({ fromId, toId, payload, action });
    }
  }
}
