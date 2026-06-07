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
					batchNo: shipment.batchNo,
					vehicleId: shipment.vehicleId,
					customerId: shipment.customerId,
					routeId: shipment.routeId,
					containerId: shipment.containerId,
					departureTime: shipment.departureTime,
					arrivalTime: shipment.arrivalTime,
					plannedArrivalTime: shipment.plannedArrivalTime,
					status: shipment.status,
					createdAt: shipment.createdAt,
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
			data: shipments.map((s: any) => ({
				id: s.id,
				batchNo: s.batchNo,
				vehicleId: s.vehicleId,
				customerId: s.customerId,
				routeId: s.routeId,
				containerId: s.containerId,
				departureTime: s.departureTime,
				arrivalTime: s.arrivalTime,
				plannedArrivalTime: s.plannedArrivalTime,
				status: s.status,
				createdAt: s.createdAt,
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
