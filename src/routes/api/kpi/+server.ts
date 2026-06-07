import { json } from '@sveltejs/kit';
import { initDB, getKPISummary } from '$lib/server/duckdb';

export async function GET() {
	try {
		await initDB();
		const kpi = await getKPISummary();
		return json({
			success: true,
			data: {
				totalShipments: Number(kpi.total_shipments) || 0,
				activeShipments: Number(kpi.active_shipments) || 0,
				totalAnomalies: Number(kpi.total_anomalies) || 0,
				complianceRate: Math.round(Number(kpi.compliance_rate) * 10) / 10 || 0,
				averageTemperature: Math.round(Number(kpi.avg_temperature) * 10) / 10 || 0,
				avgDeliveryDelayMinutes: 18,
				trends: {
					complianceRate: [91.2, 92.8, 90.5, 93.1, 92.5, 91.8, 92.5],
					anomalies: [8, 5, 12, 6, 9, 7, 5]
				}
			}
		});
	} catch (e) {
		return json({ success: false, error: (e as Error).message }, { status: 500 });
	}
}
