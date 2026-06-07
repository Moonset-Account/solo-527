import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { dataDictionary, metricDefinitions, departments, timeSlots, patientTypes, processNodes } from '$lib/dictionary';

export const GET: RequestHandler = async () => {
	return json({
		dataDictionary,
		metricDefinitions,
		dimensions: {
			departments,
			timeSlots,
			patientTypes,
			processNodes
		},
		disclaimer: {
			purpose: '本系统仅用于医院门诊流程效率分析，不涉及诊断建议',
			privacy: '所有展示数据均已进行脱敏处理，不包含个人可识别信息',
			limitations: '分析结果仅供运营优化参考，具体决策请结合实际业务场景'
		}
	});
};
