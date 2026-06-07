import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db';
import type { RequestHandler } from './$types';
import type { FunnelRequest } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: FunnelRequest = await request.json();
		const { startDate, endDate, activityTypes, communities, ageGroups, channels, weather, caliberVersion } = body;

		let caliberMapping: Record<string, string> = {};
		if (caliberVersion && caliberVersion !== 'latest') {
			const caliberResult = await query(
				'SELECT type_mapping FROM caliber_versions WHERE version_id = $1',
				[caliberVersion]
			);
			if (caliberResult.length > 0 && caliberResult[0].type_mapping) {
				caliberMapping = typeof caliberResult[0].type_mapping === 'string'
					? JSON.parse(caliberResult[0].type_mapping)
					: caliberResult[0].type_mapping;
			}
		}

		function applyCaliber(type: string): string {
			return caliberMapping[type] || type;
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
			const mappedTypes = new Set<string>();
			activityTypes.forEach(t => {
				mappedTypes.add(t);
				Object.entries(caliberMapping).forEach(([oldType, newType]) => {
					if (newType === t) mappedTypes.add(oldType);
				});
			});
			const typeArray = Array.from(mappedTypes);
			const placeholders = typeArray.map((_, i) => `$${paramIndex + i}`).join(', ');
			whereClauses.push(`a.type IN (${placeholders})`);
			params.push(...typeArray);
			paramIndex += typeArray.length;
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

		const baseParams = [...params];
		let ageJoin = '';
		let ageParams: string[] = [];
		if (ageGroups && ageGroups.length > 0) {
			const placeholders = ageGroups.map((_, i) => `$${paramIndex + i}`).join(', ');
			ageJoin = `JOIN users u ON r.user_id = u.user_id AND u.age_group IN (${placeholders})`;
			ageParams = [...ageGroups];
			params.push(...ageGroups);
			paramIndex += ageGroups.length;
		}

		const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
		const registrationParams = [...baseParams, ...ageParams];

		const browseSql = `
			SELECT COUNT(*) * 10 as count
			FROM activities a
			${whereSql}
		`;

		const registerSql = `
			SELECT COUNT(DISTINCT r.reg_id) as count
			FROM registrations r
			JOIN activities a ON r.activity_id = a.activity_id
			${ageJoin}
			${whereSql}
			AND r.status IN ('registered', 'checked_in', 'cancelled')
		`;

		const checkinSql = `
			SELECT COUNT(DISTINCT r.reg_id) as count
			FROM registrations r
			JOIN activities a ON r.activity_id = a.activity_id
			${ageJoin}
			${whereSql}
			AND r.status = 'checked_in'
		`;

		const cancelSql = `
			SELECT COUNT(DISTINCT r.reg_id) as count
			FROM registrations r
			JOIN activities a ON r.activity_id = a.activity_id
			${ageJoin}
			${whereSql}
			AND r.status = 'cancelled'
		`;

		const feedbackSql = `
			SELECT COUNT(DISTINCT f.feedback_id) as count
			FROM feedbacks f
			JOIN registrations r ON f.reg_id = r.reg_id
			JOIN activities a ON r.activity_id = a.activity_id
			${ageJoin}
			${whereSql}
		`;

		const [browseResult, registerResult, checkinResult, cancelResult, feedbackResult] = await Promise.all([
			query(browseSql, baseParams),
			query(registerSql, registrationParams),
			query(checkinSql, registrationParams),
			query(cancelSql, registrationParams),
			query(feedbackSql, registrationParams)
		]);

		const browseCount = Number(browseResult[0]?.count || 0);
		const registerCount = Number(registerResult[0]?.count || 0);
		const checkinCount = Number(checkinResult[0]?.count || 0);
		const cancelCount = Number(cancelResult[0]?.count || 0);
		const feedbackCount = Number(feedbackResult[0]?.count || 0);

		const funnel = [
			{ stage: 'browse' as const, name: '浏览', count: browseCount, rate: 100, totalRate: 100 },
			{ stage: 'register' as const, name: '报名', count: registerCount, rate: browseCount > 0 ? (registerCount / browseCount) * 100 : 0, totalRate: browseCount > 0 ? (registerCount / browseCount) * 100 : 0 },
			{ stage: 'checkin' as const, name: '签到', count: checkinCount, rate: registerCount > 0 ? (checkinCount / registerCount) * 100 : 0, totalRate: browseCount > 0 ? (checkinCount / browseCount) * 100 : 0 },
			{ stage: 'cancel' as const, name: '取消', count: cancelCount, rate: registerCount > 0 ? (cancelCount / registerCount) * 100 : 0, totalRate: browseCount > 0 ? (cancelCount / browseCount) * 100 : 0 },
			{ stage: 'feedback' as const, name: '反馈', count: feedbackCount, rate: checkinCount > 0 ? (feedbackCount / checkinCount) * 100 : 0, totalRate: browseCount > 0 ? (feedbackCount / browseCount) * 100 : 0 }
		];

		const byTypeSql = `
			SELECT 
				a.type,
				COUNT(DISTINCT CASE WHEN r.status IN ('registered', 'checked_in', 'cancelled') THEN r.reg_id END) as registered,
				COUNT(DISTINCT CASE WHEN r.status = 'checked_in' THEN r.reg_id END) as checked_in,
				COUNT(DISTINCT CASE WHEN r.status = 'cancelled' THEN r.reg_id END) as cancelled,
				COUNT(DISTINCT f.feedback_id) as feedback
			FROM activities a
			LEFT JOIN registrations r ON a.activity_id = r.activity_id
			LEFT JOIN feedbacks f ON r.reg_id = f.reg_id
			${ageJoin ? ageJoin.replace('JOIN users u', 'LEFT JOIN users u') : ''}
			${whereSql}
			GROUP BY a.type
			ORDER BY registered DESC
		`;

		const byTypeResult = await query(byTypeSql, registrationParams);
		const typeAggregation: Record<string, { registered: number; checked_in: number; cancelled: number; feedback: number }> = {};
		byTypeResult.forEach(row => {
			const mappedType = applyCaliber(row.type);
			if (!typeAggregation[mappedType]) {
				typeAggregation[mappedType] = { registered: 0, checked_in: 0, cancelled: 0, feedback: 0 };
			}
			typeAggregation[mappedType].registered += Number(row.registered) || 0;
			typeAggregation[mappedType].checked_in += Number(row.checked_in) || 0;
			typeAggregation[mappedType].cancelled += Number(row.cancelled) || 0;
			typeAggregation[mappedType].feedback += Number(row.feedback) || 0;
		});
		const byActivityType = Object.entries(typeAggregation)
			.map(([name, data]) => ({
				name,
				funnel: [data.registered * 10, data.registered, data.checked_in, data.cancelled, data.feedback]
			}))
			.sort((a, b) => b.funnel[1] - a.funnel[1]);

		const cancelReasonsSql = `
			SELECT cancel_reason_tag as tag, COUNT(*) as count
			FROM registrations r
			JOIN activities a ON r.activity_id = a.activity_id
			${ageJoin}
			${whereSql}
			AND r.status = 'cancelled'
			AND cancel_reason_tag IS NOT NULL
			GROUP BY cancel_reason_tag
			ORDER BY count DESC
		`;
		const cancelReasonsResult = await query(cancelReasonsSql, registrationParams);

		const feedbackTopicsSql = `
			SELECT t.topic as topic, COUNT(*) as count
			FROM feedbacks f
			JOIN registrations r ON f.reg_id = r.reg_id
			JOIN activities a ON r.activity_id = a.activity_id
			, UNNEST(f.topics) as t(topic)
			${ageJoin}
			${whereSql}
			GROUP BY t.topic
			ORDER BY count DESC
			LIMIT 10
		`;
		const feedbackTopicsResult = await query(feedbackTopicsSql, registrationParams);

		const minorCheckSql = `
			SELECT COUNT(*) as count
			FROM registrations r
			JOIN users u ON r.user_id = u.user_id
			JOIN activities a ON r.activity_id = a.activity_id
			${whereSql}
			AND u.is_minor = true
		`;
		const minorResult = await query(minorCheckSql, baseParams);
		const hasMinorData = Number(minorResult[0]?.count || 0) > 0;

		return json({
			funnel,
			byActivityType,
			sampleSize: registerCount,
			hasMinorData,
			cancelReasons: cancelReasonsResult.map(r => ({ tag: r.tag, count: Number(r.count) })),
			feedbackTopics: feedbackTopicsResult.map(r => ({ topic: r.topic, count: Number(r.count) }))
		});
	} catch (error) {
		console.error('Error calculating funnel:', error);
		return json({ error: 'Failed to calculate funnel' }, { status: 500 });
	}
};
