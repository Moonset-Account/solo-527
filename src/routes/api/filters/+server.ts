import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	try {
		const [activityTypes, communities, ageGroups, channels, weather, caliberVersions] = await Promise.all([
			query('SELECT DISTINCT type as value, type as label FROM activities ORDER BY type'),
			query('SELECT DISTINCT community_name as value, community_name as label FROM activities ORDER BY community_name'),
			query('SELECT DISTINCT age_group as value, age_group as label FROM users ORDER BY age_group'),
			query('SELECT DISTINCT channel as value, channel as label FROM registrations ORDER BY channel'),
			query('SELECT DISTINCT weather as value, weather as label FROM activities ORDER BY weather'),
			query('SELECT version_id, version_name, effective_date, type_mapping, is_active FROM caliber_versions ORDER BY effective_date DESC')
		]);

		return json({
			activityTypes,
			communities,
			ageGroups,
			channels,
			weather,
			caliberVersions
		});
	} catch (error) {
		console.error('Error fetching filters:', error);
		return json({ error: 'Failed to fetch filters' }, { status: 500 });
	}
};
