import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getTodoItems,
	getTodoItemById,
	createTodoItem,
	updateTodoItem,
	completeTodo,
	processTodo
} from '$server/services/todo';
import {
	mockTodos,
	getTodoStats,
	getTodosByType,
	getTodosByStatus
} from '$server/mockData';
import type { TodoItem, TodoType, Status } from '$types';

let useMock = true;

function setUseMock() {
	useMock = process.env.USE_MOCK === 'true' || !process.env.DATABASE_URL;
}

setUseMock();

export const GET: RequestHandler = async ({ url }) => {
	setUseMock();

	const type = url.searchParams.get('type') as TodoType | null;
	const status = url.searchParams.get('status') as Status | null;
	const assigneeId = url.searchParams.get('assigneeId');
	const page = parseInt(url.searchParams.get('page') || '1');
	const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
	const stats = url.searchParams.get('stats') === 'true';

	try {
		if (stats) {
			if (useMock) {
				return json(getTodoStats(assigneeId || undefined));
			}
			const result = await import('$server/services/todo').then((m) =>
				m.getTodoStats(assigneeId || undefined)
			);
			return json(result);
		}

		if (useMock) {
			let filtered = [...mockTodos];
			if (type) filtered = filtered.filter((t) => t.type === type);
			if (status) filtered = filtered.filter((t) => t.status === status);
			if (assigneeId) filtered = filtered.filter((t) => t.assigneeId === assigneeId);
			filtered.sort(
				(a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
			);
			const start = (page - 1) * pageSize;
			const end = start + pageSize;
			return json({
				data: filtered.slice(start, end),
				total: filtered.length
			});
		}

		const result = await getTodoItems(
			{
				type: type || undefined,
				status: status || undefined,
				assigneeId: assigneeId || undefined
			},
			{ page, pageSize }
		);
		return json(result);
	} catch (e) {
		console.error('Failed to get todos:', e);
		return json(
			{
				data: mockTodos,
				total: mockTodos.length
			},
			{ status: 200 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	setUseMock();

	try {
		const body = (await request.json()) as Omit<
			TodoItem,
			'id' | 'status' | 'complianceRecordId'
		>;

		if (useMock) {
			const newTodo: TodoItem = {
				...body,
				id: `todo-${Date.now()}`,
				status: 'pending'
			};
			mockTodos.push(newTodo);
			return json(newTodo, { status: 201 });
		}

		const result = await createTodoItem(body);
		return json(result, { status: 201 });
	} catch (e) {
		console.error('Failed to create todo:', e);
		throw error(500, '创建待办事项失败');
	}
};

export const PATCH: RequestHandler = async ({ request, url }) => {
	setUseMock();

	const id = url.searchParams.get('id');
	const action = url.searchParams.get('action');

	if (!id) {
		throw error(400, '缺少待办事项ID');
	}

	try {
		const body = await request.json();

		if (useMock) {
			const idx = mockTodos.findIndex((t) => t.id === id);
			if (idx < 0) {
				throw error(404, '待办事项不存在');
			}

			if (action === 'complete') {
				mockTodos[idx].status = 'completed';
				return json(mockTodos[idx]);
			}

			if (action === 'process') {
				mockTodos[idx].status = 'processing';
				return json(mockTodos[idx]);
			}

			mockTodos[idx] = { ...mockTodos[idx], ...body };
			return json(mockTodos[idx]);
		}

		if (action === 'complete') {
			const result = await completeTodo(id, body.userId, body.userName, body.processingDetails);
			return json(result);
		}

		if (action === 'process') {
			const result = await processTodo(id, body.userId, body.userName);
			return json(result);
		}

		const result = await updateTodoItem(id, body);
		return json(result);
	} catch (e) {
		console.error('Failed to update todo:', e);
		if (e instanceof Error && e.message.includes('404')) {
			throw error(404, '待办事项不存在');
		}
		throw error(500, '更新待办事项失败');
	}
};
