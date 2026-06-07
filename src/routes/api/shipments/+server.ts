import { json } from '@sveltejs/kit';
import { initDB, getShipments, getShipmentById } from '$lib/server/duckdb';

export async function GET({ url }) {
	try {
		await initDB();

		const id = url.searchParams.get('id');
		if (id) {
			const shipment = await getShipmentById(id);
			if (!shipment) {
				return json({ success: false, error: '运单不存在' }, { status: 404 });
			}
			return json({
				success: true,
				data: {
					id: shipment.id,
					batchNo: shipment.batch_no,
					vehicleId: shipment.vehicle_id,
					customerId: shipment.customer_id,
					routeId: shipment.route_id,
					containerId: shipment.container_id,
					departureTime: shipment.departure_time,
					arrivalTime: shipment.arrival_time,
					plannedArrivalTime: shipment.planned_arrival_time,
					status: shipment.status,
					createdAt: shipment.created_at,
					vehiclePlate: shipment.vehicle_plate,
					driverName: shipment.driver_name,
					customerName: shipment.customer_name,
					routeName: shipment.route_name,
					origin: shipment.origin,
					destination: shipment.destination,
					distanceKm: shipment.distance_km,
					containerCode: shipment.container_code
				}
			});
		}

		const filters: any = {};
		const vehicleIds = url.searchParams.get('vehicleIds');
		const customerIds = url.searchParams.get('customerIds');
		const routeIds = url.searchParams.get('routeIds');
		const batchNos = url.searchParams.get('batchNos');

		if (vehicleIds) filters.vehicleIds = vehicleIds.split(',');
		if (customerIds) filters.customerIds = customerIds.split(',');
		if (routeIds) filters.routeIds = routeIds.split(',');
		if (batchNos) filters.batchNos = batchNos.split(',');

		const shipments = await getShipments(filters);

		return json({
			success: true,
			data: shipments.map((s) => ({
				id: s.id,
				batchNo: s.batch_no,
				vehicleId: s.vehicle_id,
				customerId: s.customer_id,
				routeId: s.route_id,
				containerId: s.container_id,
				departureTime: s.departure_time,
				arrivalTime: s.arrival_time,
				plannedArrivalTime: s.planned_arrival_time,
				status: s.status,
				createdAt: s.created_at,
				vehiclePlate: s.vehicle_plate,
				customerName: s.customer_name,
				routeName: s.route_name,
				containerCode: s.container_code
			}))
		});
	} catch (e) {
		return json({ success: false, error: (e as Error).message }, { status: 500 });
	}
}
