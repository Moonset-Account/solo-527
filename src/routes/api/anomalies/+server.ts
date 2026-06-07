import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getAnomalyRecords, updateAnomalyAnnotation } from '$lib/server/db';
import { desensitizeRecords, getCurrentUserRole, checkPermission } from '$lib/server/security';

export const GET: RequestHandler = async () => {
	const role = getCurrentUserRole();
	if (!checkPermission(role, 'view_anomalies')) {
		return json({ error: '无权限访问异常数据' }, { status: 403 });
	}

	let records = await getAnomalyRecords();
	records = desensitizeRecords(records, role);

	return json({
		records,
		total: records.length,
		canAnnotate: checkPermission(role, 'annotate_anomalies'),
		byReason: records.reduce((acc, r) => {
			const reason = r.anomalyReason || '未知异常';
			acc[reason] = (acc[reason] || 0) + 1;
			return acc;
		}, {} as Record<string, number>)
	});
};

export const PATCH: RequestHandler = async ({ request }) => {
	const role = getCurrentUserRole();
	if (!checkPermission(role, 'annotate_anomalies')) {
		return json({ error: '无权限标注异常数据' }, { status: 403 });
	}

	const { visitId, annotation, isAnomaly } = await request.json();
	await updateAnomalyAnnotation(visitId, annotation, isAnomaly);

	return json({ success: true });
};
