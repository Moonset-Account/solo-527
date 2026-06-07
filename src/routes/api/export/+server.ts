import { json } from '@sveltejs/kit';
import { initDB, getShipments, getAnomalies, getTemperatureRecords } from '$lib/server/duckdb';

export async function GET({ url }) {
	try {
		await initDB();

		const format = (url.searchParams.get('format') || 'csv').toLowerCase();
		const dataType = url.searchParams.get('type') || 'shipments';
		const filters = url.searchParams.get('filters');

		let filterObj: any = {};
		if (filters) {
			try {
				filterObj = JSON.parse(filters);
			} catch (e) {}
		}

		let data: any[] = [];
		let filename = '';
		let columns: string[] = [];

		switch (dataType) {
			case 'shipments':
				data = await getShipments(filterObj);
				filename = `shipments_${new Date().toISOString().slice(0, 10)}`;
				columns = [
					'id', 'batchNo', 'vehicleId', 'customerId', 'routeId', 'containerId',
					'departureTime', 'arrivalTime', 'status', 'vehiclePlate', 'customerName', 'routeName'
				];
				break;
			case 'anomalies':
				data = await getAnomalies(filterObj);
				filename = `anomalies_${new Date().toISOString().slice(0, 10)}`;
				columns = [
					'id', 'shipmentId', 'batchNo', 'startTime', 'endTime', 'durationMinutes',
					'anomalyType', 'severity', 'responsibleParty', 'status', 'resolved', 'probeCalibrated', 'description'
				];
				break;
			case 'temperature':
				const shipmentId = url.searchParams.get('shipmentId');
				if (shipmentId) {
					data = await getTemperatureRecords(shipmentId);
				}
				filename = `temperature_${shipmentId || 'all'}_${new Date().toISOString().slice(0, 10)}`;
				columns = [
					'id', 'shipmentId', 'batchNo', 'probeId', 'timestamp', 'temperature',
					'humidity', 'latitude', 'longitude', 'doorOpen', 'probeCalibrated', 'calibrationDeviation'
				];
				break;
			default:
				return json({ success: false, error: '不支持的数据类型' }, { status: 400 });
		}

		if (format === 'csv') {
			const csvContent = generateCSV(data, columns);
			return new Response(csvContent, {
				headers: {
					'Content-Type': 'text/csv; charset=utf-8',
					'Content-Disposition': `attachment; filename="${filename}.csv"`
				}
			});
		} else if (format === 'pdf') {
			const csvContent = generateCSV(data, columns);
			return json({
				success: true,
				data: {
					type: dataType,
					count: data.length,
					columns,
					preview: data.slice(0, 5),
					csvContent
				},
				message: 'PDF 导出需要在服务端配置 PDF 生成库，当前返回 CSV 内容供前端处理'
			});
		} else {
			return json({ success: false, error: '不支持的导出格式' }, { status: 400 });
		}
	} catch (e) {
		return json({ success: false, error: (e as Error).message }, { status: 500 });
	}
}

function generateCSV(data: any[], columns: string[]): string {
	if (data.length === 0) {
		return columns.join(',') + '\n';
	}

	const header = columns.join(',');
	const rows = data.map((row) => {
		return columns.map((col) => {
			let value = row[col];
			if (value === undefined || value === null) {
				return '';
			}
			if (typeof value === 'object' && value instanceof Date) {
				value = value.toISOString();
			}
			const strValue = String(value);
			if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
				return `"${strValue.replace(/"/g, '""')}"`;
			}
			return strValue;
		}).join(',');
	});

	return `${header}\n${rows.join('\n')}\n`;
}
