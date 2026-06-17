import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPendingFeedbacks, processFeedback, logOperation } from '$lib/server/services/adminService';

export const GET: RequestHandler = async () => {
	try {
		const feedbacks = await getPendingFeedbacks();
		return json({ success: true, data: feedbacks });
	} catch (err) {
		console.error('Failed to fetch feedbacks:', err);
		throw error(500, '获取反馈列表失败');
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { feedbackId, processorId, affectedParties, responsiblePerson, nextSteps, processingResult, status } = body;

		if (!feedbackId || !processorId || !affectedParties || !responsiblePerson || !nextSteps) {
			throw error(400, '缺少必填参数：影响对象、责任人和下一步安排均为必填');
		}

		const result = await processFeedback(feedbackId, processorId, {
			affectedParties,
			responsiblePerson,
			nextSteps,
			processingResult,
			status
		});

		await logOperation(processorId, 'process_feedback', 'feedback', feedbackId);

		return json({ success: true, data: result });
	} catch (err) {
		console.error('Feedback processing error:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, '反馈处理失败');
	}
};
