import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const [invRes, logRes] = await Promise.all([
		fetch('/api/inventory'),
		fetch('/api/inventory/logs')
	]);
	const invData = await invRes.json();
	const logData = await logRes.json();
	return {
		inventories: invData.inventories || [],
		logs: logData.logs || []
	};
};
