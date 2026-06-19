import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/api/todos');
	const data = await res.json();
	return { todos: data.todos || [] };
};
