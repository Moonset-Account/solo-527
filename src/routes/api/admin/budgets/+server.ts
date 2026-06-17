import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { memoryStore, generateId } from '$lib/server/services/memoryStore';

export const GET: RequestHandler = async () => {
	try {
		const projects = memoryStore.getProjects();
		const budgets = projects.map((p: any) => {
			const budget = memoryStore.getBudget(p.id);
			if (budget) return budget;
			return {
				id: 'budget-' + p.id,
				projectId: p.id,
				projectName: p.title,
				totalBudget: p.budget || 0,
				spent: Math.floor((p.budget || 0) * 0.6),
				remaining: Math.floor((p.budget || 0) * 0.4),
				items: [
					{ id: generateId(), name: '物资采购', amount: Math.floor((p.budget || 0) * 0.3), category: 'materials' },
					{ id: generateId(), name: '人员补贴', amount: Math.floor((p.budget || 0) * 0.2), category: 'personnel' },
					{ id: generateId(), name: '场地费用', amount: Math.floor((p.budget || 0) * 0.1), category: 'venue' }
				],
				createdAt: p.createdAt
			};
		});

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

		const users = memoryStore.getUsers();
		const user = users.find((u) => u.id === userId);

		if (action === 'addItem') {
			const { projectId, itemName, amount, category } = data;

			if (!projectId || !itemName || !amount) {
				throw error(400, '缺少必填参数');
			}

			const projects = memoryStore.getProjects();
			const project = projects.find((p: any) => p.id === projectId);
			if (!project) {
				throw error(404, '项目不存在');
			}

			let budget = memoryStore.getBudget(projectId);
			if (!budget) {
				budget = {
					id: 'budget-' + projectId,
					projectId,
					projectName: (project as any).title,
					totalBudget: (project as any).budget || 0,
					spent: 0,
					remaining: (project as any).budget || 0,
					items: [],
					createdAt: new Date()
				};
			}

			const newItem = {
				id: generateId(),
				name: itemName,
				amount: Number(amount),
				category: category || 'other'
			};

			budget.items.push(newItem);
			budget.spent += Number(amount);
			budget.remaining = budget.totalBudget - budget.spent;

			memoryStore.setBudget(projectId, budget);

			const logs = memoryStore.getLogs();
			logs.unshift({
				id: generateId(),
				userId,
				action: 'add_budget_item',
				targetType: 'budget',
				targetId: budget.id,
				details: { itemName, amount },
				createdAt: new Date(),
				userName: user?.name || '未知'
			});
			memoryStore.setLogs(logs);

			return json({ success: true, data: newItem, budget });
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
