import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/api/routes');
	const data = await res.json();
	return { routes: data.routes || [] };
};
