import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { memoryStore, generateId } from '$lib/server/services/memoryStore';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { action, userId, shiftId, location, projectId } = body;

		if (!userId || !shiftId) {
			throw error(400, '用户ID和班次ID不能为空');
		}

		const users = memoryStore.getUsers();
		const user = users.find((u) => u.id === userId);

		let result: unknown;
		let message = '';
		let logAction = '';

		switch (action) {
			case 'register': {
				const registrations = memoryStore.getRegistrations();
				const existing = registrations.find((r: any) => r.userId === userId && r.shiftId === shiftId);
				if (existing) {
					return json({ success: false, message: '您已报名此班次' });
				}

				const newRegistration = {
					id: generateId(),
					userId,
					userName: user?.name || '未知',
					shiftId,
					projectId,
					status: 'registered',
					registeredAt: new Date()
				};

				registrations.push(newRegistration);
				memoryStore.setRegistrations(registrations);

				result = newRegistration;
				message = '报名成功';
				logAction = 'register_shift';
				break;
			}

			case 'cancel': {
				const { registrationId } = body;
				if (!registrationId) {
					throw error(400, '报名ID不能为空');
				}

				const registrations = memoryStore.getRegistrations();
				const idx = registrations.findIndex((r: any) => r.id === registrationId);
				if (idx === -1) {
					return json({ success: false, message: '报名不存在' });
				}

				registrations.splice(idx, 1);
				memoryStore.setRegistrations(registrations);

				result = { success: true };
				message = '已取消报名';
				logAction = 'cancel_registration';
				break;
			}

			case 'signin': {
				const signinRecords = memoryStore.getSigninRecords();
				const existingSignin = signinRecords.find(
					(r: any) => r.userId === userId && r.shiftId === shiftId && !r.signoutTime
				);

				if (existingSignin) {
					existingSignin.signoutTime = new Date();
					existingSignin.location = location || existingSignin.location;
					memoryStore.setSigninRecords(signinRecords);
					result = existingSignin;
					message = '签退成功';
					logAction = 'signout';
				} else {
					const newRecord = {
						id: generateId(),
						userId,
						userName: user?.name || '未知',
						shiftId,
						projectId,
						signinTime: new Date(),
						signoutTime: null,
						location: location || '默认地点',
						status: 'signed_in'
					};
					signinRecords.unshift(newRecord);
					memoryStore.setSigninRecords(signinRecords);
					result = newRecord;
					message = '签到成功';
					logAction = 'signin';
				}
				break;
			}

			default:
				throw error(400, '无效的操作类型');
		}

		const logs = memoryStore.getLogs();
		logs.unshift({
			id: generateId(),
			userId,
			action: logAction,
			targetType: 'shift',
			targetId: shiftId,
			details: { location },
			createdAt: new Date(),
			userName: user?.name || '未知'
		});
		memoryStore.setLogs(logs);

		return json({ success: true, data: result, message });
	} catch (err) {
		console.error('Registration error:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, '操作失败');
	}
};
