import AudioTrigger from '@/core/AudioTrigger';
import SaveSystem from '@/core/SaveSystem';

export class ResourceLoader {
  private static _instance: ResourceLoader | null = null;

  private _loaded: boolean = false;
  private _onLoadedCallbacks: Set<() => void> = new Set();
  private _loadingPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): ResourceLoader {
    if (!ResourceLoader._instance) {
      ResourceLoader._instance = new ResourceLoader();
    }
    return ResourceLoader._instance;
  }

  isLoaded(): boolean {
    return this._loaded;
  }

  getLoadingProgress(): number {
    return this._loaded ? 1 : 0;
  }

  onLoaded(cb: () => void): void {
    if (this._loaded) {
      try {
        cb();
      } catch (err) {
        console.error('[ResourceLoader] onLoaded callback error:', err);
      }
      return;
    }
    this._onLoadedCallbacks.add(cb);
  }

  async loadAll(): Promise<void> {
    if (this._loaded) return;
    if (this._loadingPromise) return this._loadingPromise;

    this._loadingPromise = this._doLoadAll();
    try {
      await this._loadingPromise;
    } finally {
      this._loadingPromise = null;
    }
  }

  private async _doLoadAll(): Promise<void> {
    try {
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready;
      }
    } catch (err) {
      console.warn('[ResourceLoader] font loading failed:', err);
    }

    try {
      const audio = AudioTrigger.getInstance();
      await audio.ensureContext();
    } catch (err) {
      console.warn('[ResourceLoader] audio context init failed:', err);
    }

    try {
      const saveSys = SaveSystem.getInstance();
      saveSys.load();
    } catch (err) {
      console.warn('[ResourceLoader] save system load failed:', err);
    }

    this._loaded = true;
    this._fireCallbacks();
  }

  private _fireCallbacks(): void {
    for (const cb of this._onLoadedCallbacks) {
      try {
        cb();
      } catch (err) {
        console.error('[ResourceLoader] callback error:', err);
      }
    }
    this._onLoadedCallbacks.clear();
  }
}
