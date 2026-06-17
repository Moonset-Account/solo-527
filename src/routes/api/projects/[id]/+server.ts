import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProjectById, getMaterialFlows, getHoursByProject } from '$lib/server/services/projectService';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		if (!id) {
			throw error(400, '项目ID不能为空');
		}

		const result = await getProjectById(id);
		if (!result) {
			throw error(404, '项目不存在');
		}

		const hoursData = await getHoursByProject(id);

		const materialFlowsMap: Record<string, unknown[]> = {};
		for (const mat of result.materials) {
			materialFlowsMap[mat.id] = await getMaterialFlows(mat.id);
		}

		return json({
			success: true,
			project: result.project,
			shifts: result.shifts,
			materials: result.materials,
			photos: result.photos,
			budget: result.budget,
			hoursData,
			materialFlows: materialFlowsMap
		});
	} catch (err) {
		console.error('Failed to fetch project:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, '获取项目详情失败');
	}
};
