import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db';
import type { RequestHandler } from './$types';
import type { ExportRequest } from '$lib/types';

let MOCK_USER_ROLE: 'admin' | 'operator' = 'operator';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: ExportRequest = await request.json();
		const { startDate, endDate, activityTypes, communities, ageGroups, channels, weather, exportType, userRole } = body;

		const currentRole = (userRole as 'admin' | 'operator') || MOCK_USER_ROLE;
		const isAdmin = currentRole === 'admin';

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

		let ageParams: string[] = [];
		let ageJoinForAgg = '';
		let agePlaceholders = '';

		if (ageGroups && ageGroups.length > 0) {
			agePlaceholders = ageGroups.map((_, i) => `$${paramIndex + i}`).join(', ');
			ageJoinForAgg = `JOIN users u ON r.user_id = u.user_id AND u.age_group IN (${agePlaceholders})`;
			ageParams = [...ageGroups];
		} else {
			ageJoinForAgg = 'LEFT JOIN users u ON r.user_id = u.user_id';
		}

		const registrationParams = [...baseParams, ...ageParams];
		const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

		const minorCheckSql = `
			SELECT COUNT(*) as count
			FROM registrations r
			JOIN users u ON r.user_id = u.user_id
			JOIN activities a ON r.activity_id = a.activity_id
			${ageGroups && ageGroups.length > 0 ? `AND u.age_group IN (${agePlaceholders})` : ''}
			${whereSql}
			AND u.is_minor = true
		`;
		const minorResult = await query(minorCheckSql, registrationParams);
		const hasMinorData = Number(minorResult[0]?.count || 0) > 0;

		let data: any[];
		let isAggregated = true;
		let minorDataAggregated = false;

		if (exportType === 'aggregated' || !isAdmin) {
			const aggSql = `
				SELECT 
					a.type as activity_type,
					a.community_name,
					a.weather,
					u.age_group,
					CASE WHEN u.is_minor THEN '未成年人' ELSE '成年人' END as age_category,
					COUNT(DISTINCT r.reg_id) as registrations,
					COUNT(DISTINCT CASE WHEN r.status = 'checked_in' THEN r.reg_id END) as checkins,
					COUNT(DISTINCT CASE WHEN r.status = 'cancelled' THEN r.reg_id END) as cancellations,
					COUNT(DISTINCT f.feedback_id) as feedbacks
				FROM activities a
				LEFT JOIN registrations r ON a.activity_id = r.activity_id
				LEFT JOIN feedbacks f ON r.reg_id = f.reg_id
				${ageJoinForAgg}
				${whereSql}
				GROUP BY a.type, a.community_name, a.weather, u.age_group, u.is_minor
				ORDER BY registrations DESC
			`;
			data = await query(aggSql, registrationParams);
			isAggregated = true;
			minorDataAggregated = hasMinorData;
		} else {
			const adultDetailSql = `
				SELECT 
					a.activity_id,
					a.name as activity_name,
					a.type as activity_type,
					a.community_name,
					a.weather,
					r.reg_id,
					r.register_time,
					r.original_register_time,
					r.channel,
					r.status,
					r.is_waitlist_converted,
					u.age_group,
					'成年人' as age_category,
					u.user_id
				FROM activities a
				JOIN registrations r ON a.activity_id = r.activity_id
				JOIN users u ON r.user_id = u.user_id
				${whereSql}
				${ageGroups && ageGroups.length > 0 ? `AND u.age_group IN (${agePlaceholders})` : ''}
				AND u.is_minor = false
				ORDER BY a.name, r.register_time DESC
			`;

			const minorAggSql = `
				SELECT 
					a.activity_id,
					a.name as activity_name,
					a.type as activity_type,
					a.community_name,
					a.weather,
					NULL as reg_id,
					NULL as register_time,
					NULL as original_register_time,
					NULL as channel,
					NULL as status,
					NULL as is_waitlist_converted,
					u.age_group,
					'未成年人' as age_category,
					NULL as user_id
				FROM activities a
				JOIN registrations r ON a.activity_id = r.activity_id
				JOIN users u ON r.user_id = u.user_id
				${whereSql}
				${ageGroups && ageGroups.length > 0 ? `AND u.age_group IN (${agePlaceholders})` : ''}
				AND u.is_minor = true
				GROUP BY a.activity_id, a.name, a.type, a.community_name, a.weather, u.age_group
				ORDER BY a.name
			`;

			const [adultData, minorData] = await Promise.all([
				query(adultDetailSql, registrationParams),
				query(minorAggSql, registrationParams)
			]);

			data = [...adultData, ...minorData].sort((a, b) => {
				if (a.activity_name !== b.activity_name) return a.activity_name.localeCompare(b.activity_name);
				if (!a.register_time && !b.register_time) return 0;
				if (!a.register_time) return 1;
				if (!b.register_time) return -1;
				return new Date(b.register_time).getTime() - new Date(a.register_time).getTime();
			});

			isAggregated = false;
			minorDataAggregated = hasMinorData;
		}

		const csvContent = convertToCSV(data);

		return json({
			data,
			csvContent,
			sampleSize: data.length,
			hasMinorData,
			isAggregated,
			minorDataAggregated,
			userRole: currentRole,
			isAdmin
		});
	} catch (error) {
		console.error('Error exporting data:', error);
		return json({ error: '导出失败' }, { status: 500 });
	}
};

function convertToCSV(data: any[]): string {
	if (data.length === 0) return '';
	const headers = Object.keys(data[0]);
	const csvRows = [headers.join(',')];
	for (const row of data) {
		const values = headers.map(header => {
			const val = row[header];
			if (val === null || val === undefined) return '';
			return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
		});
		csvRows.push(values.join(','));
	}
	return csvRows.join('\n');
}
