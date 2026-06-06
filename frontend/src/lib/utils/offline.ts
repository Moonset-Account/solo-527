export class OfflineCache {
	private static readonly PREFIX = 'offline_cache_';

	static set(key: string, data: any, ttlMinutes = 60): void {
		if (typeof localStorage === 'undefined') return;
		const item = {
			data,
			expires: Date.now() + ttlMinutes * 60 * 1000
		};
		localStorage.setItem(this.PREFIX + key, JSON.stringify(item));
	}

	static get<T>(key: string): T | null {
		if (typeof localStorage === 'undefined') return null;
		const raw = localStorage.getItem(this.PREFIX + key);
		if (!raw) return null;
		try {
			const item = JSON.parse(raw);
			if (Date.now() > item.expires) {
				localStorage.removeItem(this.PREFIX + key);
				return null;
			}
			return item.data as T;
		} catch {
			return null;
		}
	}

	static remove(key: string): void {
		if (typeof localStorage === 'undefined') return;
		localStorage.removeItem(this.PREFIX + key);
	}

	static clear(): void {
		if (typeof localStorage === 'undefined') return;
		Object.keys(localStorage)
			.filter((k) => k.startsWith(this.PREFIX))
			.forEach((k) => localStorage.removeItem(k));
	}
}

export class OfflineQueue {
	private static readonly KEY = 'offline_queue';

	static enqueue(action: {
		type: string;
		payload: any;
		timestamp: number;
	}): void {
		if (typeof localStorage === 'undefined') return;
		const queue = this.getAll();
		queue.push(action);
		localStorage.setItem(this.KEY, JSON.stringify(queue));
		window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: { count: queue.length } }));
	}

	static getAll(): Array<{ type: string; payload: any; timestamp: number }> {
		if (typeof localStorage === 'undefined') return [];
		const raw = localStorage.getItem(this.KEY);
		if (!raw) return [];
		try {
			return JSON.parse(raw);
		} catch {
			return [];
		}
	}

	static dequeue(): { type: string; payload: any; timestamp: number } | null {
		if (typeof localStorage === 'undefined') return null;
		const queue = this.getAll();
		const item = queue.shift();
		localStorage.setItem(this.KEY, JSON.stringify(queue));
		window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: { count: queue.length } }));
		return item || null;
	}

	static clear(): void {
		if (typeof localStorage === 'undefined') return;
		localStorage.removeItem(this.KEY);
		window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: { count: 0 } }));
	}

	static count(): number {
		return this.getAll().length;
	}
}

export function isOnline(): boolean {
	if (typeof navigator !== 'undefined') {
		return navigator.onLine;
	}
	return true;
}
