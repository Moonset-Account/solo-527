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
			data: anomalies.map((a) => ({
				id: a.id,
				shipmentId: a.shipment_id,
				batchNo: a.batch_no,
				startTime: a.start_time,
				endTime: a.end_time,
				durationMinutes: a.duration_minutes,
				anomalyType: a.anomaly_type,
				severity: a.severity,
				responsibleParty: a.responsible_party,
				status: a.status,
				resolved: a.resolved,
				resolvedAt: a.resolved_at,
				probeCalibrated: a.probe_calibrated,
				description: a.description,
				annotation: a.annotation,
				createdAt: a.created_at,
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
