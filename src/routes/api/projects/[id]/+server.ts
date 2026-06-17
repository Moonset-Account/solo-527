import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { memoryStore } from '$lib/server/services/memoryStore';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		if (!id) {
			throw error(400, '项目ID不能为空');
		}

		const projects = memoryStore.getProjects();
		const project = projects.find((p: any) => p.id === id);

		if (!project) {
			throw error(404, '项目不存在');
		}

		const shifts = memoryStore.getShifts(id);
		const materials = memoryStore.getMaterials(id);
		const photos = memoryStore.getPhotos(id);
		const budget = memoryStore.getBudget(id);

		const materialFlowsMap: Record<string, unknown[]> = {};
		for (const mat of materials) {
			materialFlowsMap[mat.id] = memoryStore.getMaterialFlows(mat.id);
		}

		const signinRecords = memoryStore.getSigninRecords();
		const projectSignins = signinRecords.filter((r: any) => r.projectId === id);
		let totalHours = 0;
		for (const record of projectSignins) {
			if (record.signoutTime) {
				const start = new Date(record.signinTime).getTime();
				const end = new Date(record.signoutTime).getTime();
				totalHours += (end - start) / (1000 * 60 * 60);
			}
		}

		const hoursData = {
			totalHours: Math.round(totalHours * 10) / 10,
			totalRecords: projectSignins.length,
			monthly: []
		};

		return json({
			success: true,
			project,
			shifts,
			materials,
			photos,
			budget,
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
