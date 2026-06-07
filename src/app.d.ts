declare module '$app/navigation' {
	export function goto(url: string, options?: any): Promise<void>;
	export function pushState(url: string, state?: any): void;
	export function replaceState(url: string, state?: any): void;
}

declare module '$app/stores' {
	import type { Readable } from 'svelte/store';

	export interface Page {
		url: URL;
		params: Record<string, string>;
		route: { id: string | null };
		status: number;
		error: Error | null;
		data: Record<string, any>;
	}

	export const page: Readable<Page>;
	export const navigating: Readable<{ from: URL | null; to: URL | null; type: string } | null>;
	export const updated: Readable<{ check(): Promise<boolean>; apply(): Promise<void> } | null>;
}

declare module '*.svelte' {
	import type { SvelteComponent } from 'svelte';
	export default SvelteComponent;
}
