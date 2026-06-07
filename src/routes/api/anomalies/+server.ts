import { json } from '@sveltejs/kit';
import { initDB, getAnomalies } from '$lib/server/duckdb';

export async function GET({ url }) {
	try {
		await initDB();

		const filters: any = {};
		const anomalyTypes = url.searchParams.get('anomalyTypes');
		const severityLevels = url.searchParams.get('severityLevels');
		const vehicleIds = url.searchParams.get('vehicleIds');
		const customerIds = url.searchParams.get('customerIds');

		if (anomalyTypes) filters.anomalyTypes = anomalyTypes.split(',');
		if (severityLevels) filters.severityLevels = severityLevels.split(',');
		if (vehicleIds) filters.vehicleIds = vehicleIds.split(',');
		if (customerIds) filters.customerIds = customerIds.split(',');

		const anomalies = await getAnomalies(filters);

		return json({
			success: true,
			data: anomalies.map((a: any) => ({
				id: a.id,
				shipmentId: a.shipmentId,
				batchNo: a.batchNo,
				startTime: a.startTime,
				endTime: a.endTime,
				durationMinutes: a.durationMinutes,
				anomalyType: a.anomalyType,
				severity: a.severity,
				responsibleParty: a.responsibleParty,
				status: a.status,
				resolved: a.resolved,
				resolvedAt: a.resolvedAt,
				probeCalibrated: a.probeCalibrated,
				description: a.description,
				annotation: a.annotation,
				createdAt: a.createdAt,
				vehicleId: a.vehicle_id,
				customerId: a.customer_id,
				routeId: a.route_id,
				containerId: a.container_id
			}))
		});
	} catch (e) {
		return json({ success: false, error: (e as Error).message }, { status: 500 });
	}
}
