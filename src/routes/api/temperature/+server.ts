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
			data: records.map((r: any) => ({
				id: r.id,
				shipmentId: r.shipmentId,
				batchNo: r.batchNo,
				probeId: r.probeId,
				timestamp: r.timestamp,
				temperature: r.temperature,
				humidity: r.humidity,
				latitude: r.latitude,
				longitude: r.longitude,
				doorOpen: r.doorOpen,
				probeCalibrated: r.probeCalibrated,
				probeCalibrationDate: r.probeCalibrationDate,
				calibrationDeviation: r.calibrationDeviation,
				createdAt: r.createdAt
			}))
		});
	} catch (e) {
		return json({ success: false, error: (e as Error).message }, { status: 500 });
	}
}
