import { json } from '@sveltejs/kit';
import { initDB, getTemperatureRecords } from '$lib/server/duckdb';

export async function GET({ url }) {
	try {
		await initDB();

		const shipmentId = url.searchParams.get('shipmentId');
		if (!shipmentId) {
			return json({ success: false, error: '缺少运单ID' }, { status: 400 });
		}

		const records = await getTemperatureRecords(shipmentId);

		return json({
			success: true,
			data: records.map((r) => ({
				id: r.id,
				shipmentId: r.shipment_id,
				batchNo: r.batch_no,
				probeId: r.probe_id,
				timestamp: r.timestamp,
				temperature: r.temperature,
				humidity: r.humidity,
				latitude: r.latitude,
				longitude: r.longitude,
				doorOpen: r.door_open,
				probeCalibrated: r.probe_calibrated,
				probeCalibrationDate: r.probe_calibration_date,
				calibrationDeviation: r.calibration_deviation,
				createdAt: r.created_at
			}))
		});
	} catch (e) {
		return json({ success: false, error: (e as Error).message }, { status: 500 });
	}
}
