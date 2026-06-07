import { json } from '@sveltejs/kit';
import { initDB, getSavedViews, saveView, deleteView } from '$lib/server/duckdb';
import type { SavedView } from '$lib/types';

export async function GET() {
	try {
		await initDB();
		const views = await getSavedViews();
		return json({
			success: true,
			data: views
		});
	} catch (e) {
		return json({ success: false, error: (e as Error).message }, { status: 500 });
	}
}

export async function POST({ request }) {
	try {
		await initDB();
		const body = await request.json();

		const view: SavedView = {
			id: body.id || `view_${Date.now()}`,
			name: body.name || '未命名视图',
			description: body.description || '',
			page: body.page || 'dashboard',
			filters: body.filters || {},
			chartConfigs: body.chartConfigs || [],
			createdBy: body.createdBy || 'system',
			createdAt: body.createdAt || new Date().toISOString()
		};

		const saved = await saveView(view);

		return json({
			success: true,
			data: saved
		});
	} catch (e) {
		return json({ success: false, error: (e as Error).message }, { status: 500 });
	}
}

export async function DELETE({ url }) {
	try {
		await initDB();
		const id = url.searchParams.get('id');
		if (!id) {
			return json({ success: false, error: '缺少视图ID' }, { status: 400 });
		}

		const result = await deleteView(id);

		return json({
			success: result,
			message: result ? '视图已删除' : '视图不存在'
		});
	} catch (e) {
		return json({ success: false, error: (e as Error).message }, { status: 500 });
	}
}
