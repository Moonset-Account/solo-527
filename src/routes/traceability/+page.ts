import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const routesRes = await fetch('/api/routes');
	const routesData = await routesRes.json();
	return { routes: routesData.routes || [] };
};
