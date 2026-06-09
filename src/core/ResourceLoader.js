import * as THREE from 'three';

export class ResourceLoader {
    constructor() {
        this.cache = new Map();
        this.loading = new Map();
        this.textureLoader = new THREE.TextureLoader();
    }

    async loadTexture(url) {
        const key = `tex:${url}`;
        if (this.cache.has(key)) return this.cache.get(key);
        if (this.loading.has(key)) return this.loading.get(key);
        const promise = new Promise((resolve, reject) => {
            this.textureLoader.load(
                url,
                (tex) => {
                    tex.colorSpace = THREE.SRGBColorSpace;
                    this.cache.set(key, tex);
                    this.loading.delete(key);
                    resolve(tex);
                },
                undefined,
                (err) => {
                    this.loading.delete(key);
                    reject(err);
                }
            );
        });
        this.loading.set(key, promise);
        return promise;
    }

    async loadJSON(url) {
        const key = `json:${url}`;
        if (this.cache.has(key)) return this.cache.get(key);
        if (this.loading.has(key)) return this.loading.get(key);
        const promise = fetch(url).then(r => r.json()).then(data => {
            this.cache.set(key, data);
            this.loading.delete(key);
            return data;
        }).catch(err => {
            this.loading.delete(key);
            throw err;
        });
        this.loading.set(key, promise);
        return promise;
    }

    async loadBatch(items, onProgress) {
        const total = items.length;
        let done = 0;
        const results = [];
        for (let i = 0; i < items.length; i++) {
            const { type, url } = items[i];
            try {
                let result;
                switch (type) {
                    case 'texture': result = await this.loadTexture(url); break;
                    case 'json': result = await this.loadJSON(url); break;
                    default: result = null;
                }
                results.push({ url, success: true, data: result });
            } catch (e) {
                results.push({ url, success: false, error: e });
            }
            done++;
            if (onProgress) onProgress(done / total, done, total, items[i]);
        }
        return results;
    }

    clear() {
        for (const [key, value] of this.cache) {
            if (value instanceof THREE.Texture) value.dispose();
        }
        this.cache.clear();
    }

    get(key) {
        return this.cache.get(key);
    }

    set(key, value) {
        this.cache.set(key, value);
    }
}
