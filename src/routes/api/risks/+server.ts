import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getRiskAlerts,
	getRiskAlertById,
	createRiskAlert,
	resolveRisk,
	processRisk
} from '$server/services/risk';
import {
	mockRisks,
	getRiskStats,
	getRisksByLevel,
	getPendingRisks
} from '$server/mockData';
import type { RiskAlert, HazardLevel, Status } from '$types';

let useMock = true;

function setUseMock() {
	useMock = process.env.USE_MOCK === 'true' || !process.env.DATABASE_URL;
}

setUseMock();

export const GET: RequestHandler = async ({ url }) => {
	setUseMock();

	const userId = url.searchParams.get('userId');
	const status = url.searchParams.get('status') as Status | null;
	const riskLevel = url.searchParams.get('riskLevel') as HazardLevel | null;
	const page = parseInt(url.searchParams.get('page') || '1');
	const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
	const stats = url.searchParams.get('stats') === 'true';

	try {
		if (stats) {
			if (useMock) {
				return json(getRiskStats(userId || undefined));
			}
			const result = await import('$server/services/risk').then((m) =>
				m.getRiskStats(userId || undefined)
			);
			return json(result);
		}

		if (useMock) {
			let filtered = [...mockRisks];
			if (userId) filtered = filtered.filter((r) => r.userId === userId);
			if (status) filtered = filtered.filter((r) => r.status === status);
			if (riskLevel) filtered = filtered.filter((r) => r.riskLevel === riskLevel);
			filtered.sort(
				(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			);
			const start = (page - 1) * pageSize;
			const end = start + pageSize;
			return json({
				data: filtered.slice(start, end),
				total: filtered.length
			});
		}

		const result = await getRiskAlerts(
			{
				userId: userId || undefined,
				status: status || undefined,
				riskLevel: riskLevel || undefined
			},
			{ page, pageSize }
		);
		return json(result);
	} catch (e) {
		console.error('Failed to get risks:', e);
		return json(
			{
				data: mockRisks,
				total: mockRisks.length
			},
			{ status: 200 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	setUseMock();

	try {
		const body = (await request.json()) as Omit<
			RiskAlert,
			'id' | 'status' | 'createdAt' | 'complianceRecordId'
		>;

		if (useMock) {
			const newRisk: RiskAlert = {
				...body,
				id: `risk-${Date.now()}`,
				status: 'pending',
				createdAt: new Date()
			};
			mockRisks.push(newRisk);
			return json(newRisk, { status: 201 });
		}

		const result = await createRiskAlert(body);
		return json(result, { status: 201 });
	} catch (e) {
		console.error('Failed to create risk:', e);
		throw error(500, '创建风险提醒失败');
	}
};

export const PATCH: RequestHandler = async ({ request, url }) => {
	setUseMock();

	const id = url.searchParams.get('id');
	const action = url.searchParams.get('action');

	if (!id) {
		throw error(400, '缺少风险提醒ID');
	}

	try {
		const body = await request.json();

		if (useMock) {
			const idx = mockRisks.findIndex((r) => r.id === id);
			if (idx < 0) {
				throw error(404, '风险提醒不存在');
			}

			if (action === 'resolve') {
				mockRisks[idx].status = 'resolved';
				mockRisks[idx].resolution = body.resolution;
				mockRisks[idx].resolvedAt = new Date();
				return json(mockRisks[idx]);
			}

			if (action === 'process') {
				mockRisks[idx].status = 'processing';
				return json(mockRisks[idx]);
			}

			mockRisks[idx] = { ...mockRisks[idx], ...body };
			return json(mockRisks[idx]);
		}

		if (action === 'resolve') {
			const result = await resolveRisk(id, body.resolution, body.userId, body.userName);
			return json(result);
		}

		if (action === 'process') {
			const result = await processRisk(id, body.userId, body.userName);
			return json(result);
		}

		throw error(400, '无效的操作类型');
	} catch (e) {
		console.error('Failed to update risk:', e);
		if (e instanceof Error && e.message.includes('404')) {
			throw error(404, '风险提醒不存在');
		}
		if (e instanceof Error && e.message.includes('400')) {
			throw error(400, '无效的操作类型');
		}
		throw error(500, '更新风险提醒失败');
	}
};
