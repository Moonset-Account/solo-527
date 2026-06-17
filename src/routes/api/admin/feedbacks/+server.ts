import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { memoryStore, generateId } from '$lib/server/services/memoryStore';
import type { FeedbackWithDetails, FeedbackProcessingWithDetails } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const status = url.searchParams.get('status');
		let feedbacks = memoryStore.getFeedbacks() as FeedbackWithDetails[];

		if (status && status !== 'all') {
			feedbacks = feedbacks.filter((f) => f.status === status);
		}

		feedbacks = [...feedbacks].sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);

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

		const feedbacks = memoryStore.getFeedbacks() as FeedbackWithDetails[];
		const feedbackIndex = feedbacks.findIndex((f) => f.id === feedbackId);

		if (feedbackIndex === -1) {
			throw error(404, '反馈不存在');
		}

		const users = memoryStore.getUsers();
		const processor = users.find((u) => u.id === processorId);

		const newProcessing: FeedbackProcessingWithDetails = {
			id: generateId(),
			feedbackId,
			processorId,
			processorName: processor?.name || '未知',
			affectedParties,
			responsiblePerson,
			nextSteps,
			processingResult: processingResult || '',
			status: status || 'processing',
			processedAt: new Date()
		};

		feedbacks[feedbackIndex] = {
			...feedbacks[feedbackIndex],
			status: status || feedbacks[feedbackIndex].status,
			processings: [...feedbacks[feedbackIndex].processings, newProcessing]
		};

		memoryStore.setFeedbacks(feedbacks);

		const logs = memoryStore.getLogs();
		logs.unshift({
			id: generateId(),
			userId: processorId,
			action: 'process_feedback',
			targetType: 'feedback',
			targetId: feedbackId,
			details: { affectedParties, responsiblePerson },
			createdAt: new Date(),
			userName: processor?.name || '未知'
		});
		memoryStore.setLogs(logs);

		return json({ success: true, data: newProcessing, feedback: feedbacks[feedbackIndex] });
	} catch (err) {
		console.error('Feedback processing error:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, '反馈处理失败');
	}
};
