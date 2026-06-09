export interface LoadProgress {
  loaded: number;
  total: number;
  percent: number;
  currentKey?: string;
}

export type ProgressCallback = (progress: LoadProgress) => void;

export interface AssetMap {
  [key: string]: unknown;
}

export interface LoadResult<T extends AssetMap> {
  assets: T;
  failed: Array<{ key: string; error: Error }>;
}

export class AssetLoader {
  private cache: Map<string, unknown> = new Map();

  private static readonly DEFAULT_JSON = {};
  private static readonly DEFAULT_IMAGE: HTMLImageElement = (() => {
    const img = new Image();
    img.width = 1;
    img.height = 1;
    return img;
  })();
  private static readonly DEFAULT_SVG = '';

  has(key: string): boolean {
    return this.cache.has(key);
  }

  get<T = unknown>(key: string): T | undefined {
    return this.cache.get(key) as T | undefined;
  }

  clear(): void {
    this.cache.clear();
  }

  async loadJSON(url: string): Promise<unknown> {
    const cached = this.cache.get(url);
    if (cached !== undefined) return cached;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load JSON: ${url} (status ${response.status})`);
    }
    const data = await response.json();
    this.cache.set(url, data);
    return data;
  }

  async loadImage(url: string, crossOrigin?: string): Promise<HTMLImageElement> {
    const cached = this.cache.get(url);
    if (cached !== undefined) return cached as HTMLImageElement;

    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      if (crossOrigin) img.crossOrigin = crossOrigin;
      img.onload = () => {
        this.cache.set(url, img);
        resolve(img);
      };
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });
  }

  async loadSVG(url: string): Promise<string> {
    const cached = this.cache.get(url);
    if (cached !== undefined) return cached as string;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load SVG: ${url} (status ${response.status})`);
    }
    const text = await response.text();
    this.cache.set(url, text);
    return text;
  }

  async load<T extends AssetMap>(
    manifest: {
      json?: Array<{ key: string; url: string }>;
      images?: Array<{ key: string; url: string; crossOrigin?: string }>;
      svgs?: Array<{ key: string; url: string }>;
    },
    onProgress?: ProgressCallback
  ): Promise<LoadResult<T>> {
    const tasks: Array<{ key: string; type: 'json' | 'image' | 'svg'; url: string; crossOrigin?: string }> = [];

    for (const item of manifest.json ?? []) {
      tasks.push({ key: item.key, type: 'json', url: item.url });
    }
    for (const item of manifest.images ?? []) {
      tasks.push({ key: item.key, type: 'image', url: item.url, crossOrigin: item.crossOrigin });
    }
    for (const item of manifest.svgs ?? []) {
      tasks.push({ key: item.key, type: 'svg', url: item.url });
    }

    const total = tasks.length;
    let loaded = 0;
    const assets: Record<string, unknown> = {};
    const failed: Array<{ key: string; error: Error }> = [];

    const reportProgress = (currentKey?: string) => {
      if (onProgress) {
        onProgress({
          loaded,
          total,
          percent: total === 0 ? 100 : (loaded / total) * 100,
          currentKey,
        });
      }
    };

    if (total === 0) {
      reportProgress();
      return { assets: {} as T, failed: [] };
    }

    const results = await Promise.all(
      tasks.map(async task => {
        try {
          let value: unknown;
          switch (task.type) {
            case 'json':
              value = await this.loadJSON(task.url);
              break;
            case 'image':
              value = await this.loadImage(task.url, task.crossOrigin);
              break;
            case 'svg':
              value = await this.loadSVG(task.url);
              break;
          }
          loaded++;
          reportProgress(task.key);
          return { key: task.key, value, error: null as Error | null };
        } catch (e) {
          loaded++;
          const err = e instanceof Error ? e : new Error(String(e));
          reportProgress(task.key);
          return { key: task.key, value: undefined, error: err };
        }
      })
    );

    for (const r of results) {
      if (r.error) {
        failed.push({ key: r.key, error: r.error });
      } else {
        assets[r.key] = r.value;
      }
    }

    return { assets: assets as T, failed };
  }

  getOrDefault<T>(key: string, defaultValue: T): T {
    const val = this.cache.get(key);
    return (val !== undefined ? val : defaultValue) as T;
  }

  getJSON(key: string): unknown {
    return this.getOrDefault(key, AssetLoader.DEFAULT_JSON);
  }

  getImage(key: string): HTMLImageElement {
    return this.getOrDefault(key, AssetLoader.DEFAULT_IMAGE);
  }

  getSVG(key: string): string {
    return this.getOrDefault(key, AssetLoader.DEFAULT_SVG);
  }
}
