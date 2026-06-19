import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/api/rules');
	const data = await res.json();
	return { rules: data.rules || [] };
};
