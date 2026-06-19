import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	const [routeRes, itinRes] = await Promise.all([
		fetch(`/api/routes/${params.id}`),
		fetch(`/api/routes/${params.id}/itineraries`)
	]);
	const routeData = await routeRes.json();
	const itinData = await itinRes.json();
	return {
		route: routeData.route,
		inventory: routeData.inventory,
		itineraries: itinData.itineraries || []
	};
};
