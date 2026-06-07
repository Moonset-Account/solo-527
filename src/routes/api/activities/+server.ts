import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db';
import type { RequestHandler } from './$types';
import type { FunnelRequest } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: Partial<FunnelRequest> = await request.json();
		const { startDate, endDate, activityTypes, communities, ageGroups, channels, weather } = body;

		const whereClauses: string[] = [];
		const baseParams: any[] = [];
		let paramIndex = 1;

		if (startDate && endDate) {
			whereClauses.push(`a.start_time BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
			baseParams.push(startDate, endDate);
			paramIndex += 2;
		}

		if (activityTypes && activityTypes.length > 0) {
			const placeholders = activityTypes.map((_, i) => `$${paramIndex + i}`).join(', ');
			whereClauses.push(`a.type IN (${placeholders})`);
			baseParams.push(...activityTypes);
			paramIndex += activityTypes.length;
		}

		if (communities && communities.length > 0) {
			const placeholders = communities.map((_, i) => `$${paramIndex + i}`).join(', ');
			whereClauses.push(`a.community_name IN (${placeholders})`);
			baseParams.push(...communities);
			paramIndex += communities.length;
		}

		if (channels && channels.length > 0) {
			const placeholders = channels.map((_, i) => `$${paramIndex + i}`).join(', ');
			whereClauses.push(`r.channel IN (${placeholders})`);
			baseParams.push(...channels);
			paramIndex += channels.length;
		}

		if (weather && weather.length > 0) {
			const placeholders = weather.map((_, i) => `$${paramIndex + i}`).join(', ');
			whereClauses.push(`a.weather IN (${placeholders})`);
			baseParams.push(...weather);
			paramIndex += weather.length;
		}

		let ageJoin = '';
		let ageParams: string[] = [];
		if (ageGroups && ageGroups.length > 0) {
			const placeholders = ageGroups.map((_, i) => `$${paramIndex + i}`).join(', ');
			ageJoin = `JOIN users u ON r.user_id = u.user_id AND u.age_group IN (${placeholders})`;
			ageParams = [...ageGroups];
		}

		const queryParams = [...baseParams, ...ageParams];
		const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

		const sql = `
			SELECT 
				a.activity_id,
				a.name,
				a.type,
				a.start_time,
				a.community_name,
				a.weather,
				COUNT(DISTINCT r.reg_id) as registrations,
				COUNT(DISTINCT CASE WHEN r.status = 'checked_in' THEN r.reg_id END) as checkins,
				COUNT(DISTINCT CASE WHEN r.status = 'cancelled' THEN r.reg_id END) as cancellations,
				COUNT(DISTINCT f.feedback_id) as feedback_count
			FROM activities a
			LEFT JOIN registrations r ON a.activity_id = r.activity_id
			${ageJoin}
			LEFT JOIN feedbacks f ON r.reg_id = f.reg_id
			${whereSql}
			GROUP BY a.activity_id, a.name, a.type, a.start_time, a.community_name, a.weather
			ORDER BY registrations DESC
			LIMIT 50
		`;

		const activities = await query(sql, queryParams);

		return json({
			activities: activities.map(a => ({
				...a,
				registrations: Number(a.registrations),
				checkins: Number(a.checkins),
				cancellations: Number(a.cancellations),
				feedback_count: Number(a.feedback_count)
			}))
		});
	} catch (error) {
		console.error('Error fetching activities:', error);
		return json({ error: '获取活动列表失败' }, { status: 500 });
	}
};
