import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { registerForShift, cancelRegistration, signin } from '$lib/server/services/registrationService';
import { logOperation } from '$lib/server/services/adminService';
import { auth } from '$lib/stores/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();
		const { action, userId, shiftId, location } = body;

		if (!userId || !shiftId) {
			throw error(400, '用户ID和班次ID不能为空');
		}

		let result: unknown;
		let message = '';
		let logAction = '';

		switch (action) {
			case 'register': {
				const registration = await registerForShift(userId, shiftId);
				if (!registration) {
					return json({ success: false, message: '您已报名此班次' });
				}
				result = registration;
				message = '报名成功';
				logAction = 'register_shift';
				break;
			}
			case 'cancel': {
				const { registrationId } = body;
				if (!registrationId) {
					throw error(400, '报名ID不能为空');
				}
				const success = await cancelRegistration(registrationId);
				result = { success };
				message = success ? '已取消报名' : '取消失败';
				logAction = 'cancel_registration';
				break;
			}
			case 'signin': {
				const record = await signin(userId, shiftId, location);
				result = record;
				message = record?.signoutTime ? '签退成功' : '签到成功';
				logAction = record?.signoutTime ? 'signout' : 'signin';
				break;
			}
			default:
				throw error(400, '无效的操作类型');
		}

		await logOperation(userId, logAction, 'shift', shiftId);

		return json({ success: true, data: result, message });
	} catch (err) {
		console.error('Registration error:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, '操作失败');
	}
};
