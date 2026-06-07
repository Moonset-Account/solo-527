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

declare module 'papaparse' {
	export interface ParseResult<T = any> {
		data: T[];
		errors: any[];
		meta: any;
	}

	export interface ParseConfig<T = any> {
		header?: boolean;
		delimiter?: string;
		skipEmptyLines?: boolean;
		complete?: (results: ParseResult<T>) => void;
		error?: (error: any) => void;
		step?: (results: ParseResult<T>, parser: any) => void;
		dynamicTyping?: boolean;
	}

	export function parse<T = any>(input: string | File, config?: ParseConfig<T>): void;

	export function unparse(data: any, config?: any): string;
}

