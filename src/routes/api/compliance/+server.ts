import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getComplianceRecords,
	getComplianceRecordById,
	createComplianceRecord,
	updateComplianceRecord,
	generateComplianceCSV,
	getComplianceStats
} from '$server/services/compliance';
import { mockCompliance, getComplianceStats as getMockComplianceStats } from '$server/mockData';
import type { ComplianceRecord, ComplianceType, Status } from '$types';

let useMock = true;

function setUseMock() {
	useMock = process.env.USE_MOCK === 'true' || !process.env.DATABASE_URL;
}

setUseMock();

export const GET: RequestHandler = async ({ url }) => {
	setUseMock();

	const type = url.searchParams.get('type') as ComplianceType | null;
	const status = url.searchParams.get('status') as Status | null;
	const operatorId = url.searchParams.get('operatorId');
	const startDate = url.searchParams.get('startDate');
	const endDate = url.searchParams.get('endDate');
	const page = parseInt(url.searchParams.get('page') || '1');
	const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
	const stats = url.searchParams.get('stats') === 'true';
	const exportCSV = url.searchParams.get('export') === 'csv';

	try {
		if (stats) {
			if (useMock) {
				return json(getMockComplianceStats());
			}
			const result = await getComplianceStats();
			return json(result);
		}

		if (useMock) {
			let filtered = [...mockCompliance];
			if (type) filtered = filtered.filter((c) => c.type === type);
			if (status) filtered = filtered.filter((c) => c.status === status);
			if (operatorId) filtered = filtered.filter((c) => c.operatorId === operatorId);
			filtered.sort(
				(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			);

			if (exportCSV) {
				const headers = [
					'ID',
					'类型',
					'状态',
					'操作人',
					'详情',
					'创建时间',
					'处理时间'
				];

				const typeMap: Record<ComplianceType, string> = {
					requisition: '领用申请',
					experiment: '实验数据',
					todo: '待办事项',
					risk: '风险处理'
				};

				const statusMap: Record<Status, string> = {
					pending: '待处理',
					approved: '已批准',
					rejected: '已拒绝',
					completed: '已完成',
					processing: '处理中',
					resolved: '已解决',
					failed: '已失败'
				};

				const rows = filtered.map((record) => [
					record.id,
					typeMap[record.type] || record.type,
					statusMap[record.status] || record.status,
					record.operator,
					`"${record.details.replace(/"/g, '""')}"`,
					new Date(record.createdAt).toLocaleString('zh-CN'),
					record.processedAt ? new Date(record.processedAt).toLocaleString('zh-CN') : ''
				]);

				const csvContent =
					'\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

				return new Response(csvContent, {
					headers: {
						'Content-Type': 'text/csv; charset=utf-8',
						'Content-Disposition': `attachment; filename="安全合规记录_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv"`
					}
				});
			}

			const start = (page - 1) * pageSize;
			const end = start + pageSize;
			return json({
				data: filtered.slice(start, end),
				total: filtered.length
			});
		}

		if (exportCSV) {
			const csvContent = await generateComplianceCSV({
				type: type || undefined,
				status: status || undefined,
				operatorId: operatorId || undefined,
				startDate: startDate ? new Date(startDate) : undefined,
				endDate: endDate ? new Date(endDate) : undefined
			});

			return new Response(csvContent, {
				headers: {
					'Content-Type': 'text/csv; charset=utf-8',
					'Content-Disposition': `attachment; filename="安全合规记录_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv"`
				}
			});
		}

		const result = await getComplianceRecords(
			{
				type: type || undefined,
				status: status || undefined,
				operatorId: operatorId || undefined,
				startDate: startDate ? new Date(startDate) : undefined,
				endDate: endDate ? new Date(endDate) : undefined
			},
			{ page, pageSize }
		);
		return json(result);
	} catch (e) {
		console.error('Failed to get compliance records:', e);
		return json(
			{
				data: mockCompliance,
				total: mockCompliance.length
			},
			{ status: 200 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	setUseMock();

	try {
		const body = (await request.json()) as Omit<ComplianceRecord, 'id' | 'createdAt'>;

		if (useMock) {
			const newRecord: ComplianceRecord = {
				...body,
				id: `comp-${Date.now()}`,
				createdAt: new Date()
			};
			mockCompliance.push(newRecord);
			return json(newRecord, { status: 201 });
		}

		const result = await createComplianceRecord(body);
		return json(result, { status: 201 });
	} catch (e) {
		console.error('Failed to create compliance record:', e);
		throw error(500, '创建合规记录失败');
	}
};

export const PATCH: RequestHandler = async ({ request, url }) => {
	setUseMock();

	const id = url.searchParams.get('id');

	if (!id) {
		throw error(400, '缺少合规记录ID');
	}

	try {
		const body = await request.json();

		if (useMock) {
			const idx = mockCompliance.findIndex((c) => c.id === id);
			if (idx < 0) {
				throw error(404, '合规记录不存在');
			}

			mockCompliance[idx] = { ...mockCompliance[idx], ...body };
			return json(mockCompliance[idx]);
		}

		const result = await updateComplianceRecord(id, body);
		return json(result);
	} catch (e) {
		console.error('Failed to update compliance record:', e);
		if (e instanceof Error && e.message.includes('404')) {
			throw error(404, '合规记录不存在');
		}
		throw error(500, '更新合规记录失败');
	}
};
