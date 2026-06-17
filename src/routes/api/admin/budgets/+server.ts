import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllBudgets, addBudgetItem, createBudget, logOperation } from '$lib/server/services/adminService';

export const GET: RequestHandler = async () => {
	try {
		const budgets = await getAllBudgets();
		return json({ success: true, data: budgets });
	} catch (err) {
		console.error('Failed to fetch budgets:', err);
		throw error(500, '获取预算数据失败');
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { action, userId, ...data } = body;

		if (action === 'createBudget') {
			const budget = await createBudget(data);
			await logOperation(userId, 'create_budget', 'budget', budget.id);
			return json({ success: true, data: budget });
		}

		if (action === 'addItem') {
			if (!data.budgetId || !data.itemName || !data.amount) {
				throw error(400, '缺少必填参数');
			}
			const item = await addBudgetItem(data);
			await logOperation(userId, 'add_budget_item', 'budget', data.budgetId);
			return json({ success: true, data: item });
		}

		throw error(400, '无效的操作类型');
	} catch (err) {
		console.error('Budget operation error:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, '预算操作失败');
	}
};
