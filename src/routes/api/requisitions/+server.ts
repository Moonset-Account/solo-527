import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getRequisitions,
	getRequisitionById,
	createRequisition,
	updateRequisition,
	approveRequisition,
	rejectRequisition
} from '$server/services/requisition';
import { mockRequisitions, mockReagents } from '$server/mockData';
import type { Requisition, Status } from '$types';

let useMock = true;

function setUseMock() {
	useMock = process.env.USE_MOCK === 'true' || !process.env.DATABASE_URL;
}

setUseMock();

export const GET: RequestHandler = async ({ url }) => {
	setUseMock();

	const userId = url.searchParams.get('userId');
	const status = url.searchParams.get('status') as Status | null;
	const page = parseInt(url.searchParams.get('page') || '1');
	const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

	try {
		if (useMock) {
			let filtered = [...mockRequisitions];
			if (userId) filtered = filtered.filter((r) => r.userId === userId);
			if (status) filtered = filtered.filter((r) => r.status === status);
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

		const result = await getRequisitions(
			{ userId: userId || undefined, status: status || undefined },
			{ page, pageSize }
		);
		return json(result);
	} catch (e) {
		console.error('Failed to get requisitions:', e);
		return json(
			{
				data: mockRequisitions,
				total: mockRequisitions.length
			},
			{ status: 200 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	setUseMock();

	try {
		const body = (await request.json()) as Omit<
			Requisition,
			'id' | 'createdAt' | 'complianceRecordId' | 'reagent'
		>;

		if (useMock) {
			const reagent = mockReagents.find((r) => r.id === body.reagentId);
			const newRequisition: Requisition = {
				...body,
				reagent: reagent || undefined,
				id: `req-${Date.now()}`,
				status: 'pending',
				createdAt: new Date()
			};
			mockRequisitions.push(newRequisition);
			return json(newRequisition, { status: 201 });
		}

		const result = await createRequisition(body);
		return json(result, { status: 201 });
	} catch (e) {
		console.error('Failed to create requisition:', e);
		throw error(500, '创建领用申请失败');
	}
};

export const PATCH: RequestHandler = async ({ request, url }) => {
	setUseMock();

	const id = url.searchParams.get('id');
	const action = url.searchParams.get('action');

	if (!id) {
		throw error(400, '缺少领用申请ID');
	}

	try {
		const body = await request.json();

		if (useMock) {
			const idx = mockRequisitions.findIndex((r) => r.id === id);
			if (idx < 0) {
				throw error(404, '领用申请不存在');
			}

			if (action === 'approve') {
				mockRequisitions[idx].status = 'approved';
				return json(mockRequisitions[idx]);
			}

			if (action === 'reject') {
				mockRequisitions[idx].status = 'rejected';
				(mockRequisitions[idx] as any).rejectionReason = body.rejectionReason;
				return json(mockRequisitions[idx]);
			}

			mockRequisitions[idx] = { ...mockRequisitions[idx], ...body };
			return json(mockRequisitions[idx]);
		}

		if (action === 'approve') {
			const result = await approveRequisition(id, body.userId, body.userName);
			return json(result);
		}

		if (action === 'reject') {
			const result = await rejectRequisition(id, body.userId, body.userName, body.rejectionReason);
			return json(result);
		}

		const result = await updateRequisition(id, body);
		return json(result);
	} catch (e) {
		console.error('Failed to update requisition:', e);
		if (e instanceof Error && e.message.includes('404')) {
			throw error(404, '领用申请不存在');
		}
		throw error(500, '更新领用申请失败');
	}
};
