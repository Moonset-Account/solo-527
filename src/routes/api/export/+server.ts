import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db';
import type { RequestHandler } from './$types';
import type { ExportRequest } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: ExportRequest = await request.json();
		const { startDate, endDate, activityTypes, communities, ageGroups, channels, weather, exportType, includeDetails } = body;

		const userRole = 'operator' as string;

		if (includeDetails && userRole !== 'admin') {
			return json({ error: '无权限导出明细数据' }, { status: 403 });
		}

		const whereClauses: string[] = [];
		const params: any[] = [];
		let paramIndex = 1;

		if (startDate && endDate) {
			whereClauses.push(`a.start_time BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
			params.push(startDate, endDate);
			paramIndex += 2;
		}

		if (activityTypes && activityTypes.length > 0) {
			const placeholders = activityTypes.map((_, i) => `$${paramIndex + i}`).join(', ');
			whereClauses.push(`a.type IN (${placeholders})`);
			params.push(...activityTypes);
			paramIndex += activityTypes.length;
		}

		if (communities && communities.length > 0) {
			const placeholders = communities.map((_, i) => `$${paramIndex + i}`).join(', ');
			whereClauses.push(`a.community_name IN (${placeholders})`);
			params.push(...communities);
			paramIndex += communities.length;
		}

		if (channels && channels.length > 0) {
			const placeholders = channels.map((_, i) => `$${paramIndex + i}`).join(', ');
			whereClauses.push(`r.channel IN (${placeholders})`);
			params.push(...channels);
			paramIndex += channels.length;
		}

		if (weather && weather.length > 0) {
			const placeholders = weather.map((_, i) => `$${paramIndex + i}`).join(', ');
			whereClauses.push(`a.weather IN (${placeholders})`);
			params.push(...weather);
			paramIndex += weather.length;
		}

		let ageJoin = '';
		if (ageGroups && ageGroups.length > 0) {
			const placeholders = ageGroups.map((_, i) => `$${paramIndex + i}`).join(', ');
			ageJoin = `JOIN users u ON r.user_id = u.user_id AND u.age_group IN (${placeholders})`;
			params.push(...ageGroups);
			paramIndex += ageGroups.length;
		}

		const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

		let data: any[];

		if (exportType === 'aggregated' || (userRole as string) !== 'admin') {
			const aggSql = `
				SELECT 
					a.type as activity_type,
					a.community_name,
					a.weather,
					COUNT(DISTINCT r.reg_id) as registrations,
					COUNT(DISTINCT CASE WHEN r.status = 'checked_in' THEN r.reg_id END) as checkins,
					COUNT(DISTINCT CASE WHEN r.status = 'cancelled' THEN r.reg_id END) as cancellations,
					COUNT(DISTINCT f.feedback_id) as feedbacks,
					u.age_group
				FROM activities a
				LEFT JOIN registrations r ON a.activity_id = r.activity_id
				LEFT JOIN feedbacks f ON r.reg_id = f.reg_id
				${ageGroups && ageGroups.length > 0 ? 'JOIN users u ON r.user_id = u.user_id' : 'LEFT JOIN users u ON r.user_id = u.user_id'}
				${whereSql}
				GROUP BY a.type, a.community_name, a.weather, u.age_group
				ORDER BY registrations DESC
			`;
			data = await query(aggSql, params);
		} else {
			const detailSql = `
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
					CASE WHEN u.is_minor THEN '未成年人' ELSE '成年人' END as age_category
				FROM activities a
				JOIN registrations r ON a.activity_id = r.activity_id
				JOIN users u ON r.user_id = u.user_id
				${whereSql}
				ORDER BY r.register_time DESC
			`;
			data = await query(detailSql, params);
		}

		const minorCheckSql = `
			SELECT COUNT(*) as count
			FROM registrations r
			JOIN users u ON r.user_id = u.user_id
			JOIN activities a ON r.activity_id = a.activity_id
			${whereSql}
			AND u.is_minor = true
		`;
		const minorResult = await query(minorCheckSql, params);
		const hasMinorData = Number(minorResult[0]?.count || 0) > 0;

		const csvContent = convertToCSV(data);

		return json({
			data,
			csvContent,
			sampleSize: data.length,
			hasMinorData,
			isAggregated: exportType === 'aggregated' || (userRole as string) !== 'admin'
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
			return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
		});
		csvRows.push(values.join(','));
	}
	return csvRows.join('\n');
}
