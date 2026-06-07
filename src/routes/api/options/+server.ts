import { json } from '@sveltejs/kit';
import { initDB, getVehicles, getCustomers, getRoutes, getContainers } from '$lib/server/duckdb';

export async function GET() {
	try {
		await initDB();

		const [vehicles, customers, routes, containers] = await Promise.all([
			getVehicles(),
			getCustomers(),
			getRoutes(),
			getContainers()
		]);

		return json({
			success: true,
			data: {
				vehicles: vehicles.map((v) => ({ id: v.id, label: v.plateNumber })),
				customers: customers.map((c) => ({ id: c.id, label: c.name })),
				routes: routes.map((r) => ({ id: r.id, label: r.name })),
				containers: containers.map((c) => ({ id: c.id, label: c.code })),
				anomalyTypes: [
					{ key: 'over_temp', label: '温度超标' },
					{ key: 'under_temp', label: '温度过低' },
					{ key: 'door_open', label: '开门超时' },
					{ key: 'probe_error', label: '探头故障' },
					{ key: 'delay', label: '到货延迟' }
				],
				severityLevels: [
					{ key: 'low', label: '低' },
					{ key: 'medium', label: '中' },
					{ key: 'high', label: '高' },
					{ key: 'critical', label: '严重' }
				]
			}
		});
	} catch (e) {
		return json({ success: false, error: (e as Error).message }, { status: 500 });
	}
}
