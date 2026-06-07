import * as duckdb from 'duckdb';
import type {
	Vehicle,
	Customer,
	Route,
	Container,
	Shipment,
	TemperatureRecord,
	AnomalyRecord,
	LocationRecord,
	DoorEvent
} from '$lib/types';
import { generateMockData } from '$lib/data/mockData';

let db: duckdb.Database | null = null;

export async function initDB(): Promise<duckdb.Database> {
	if (db) return db;

	return new Promise((resolve, reject) => {
		db = new duckdb.Database(':memory:', (err) => {
			if (err) {
				reject(err);
				return;
			}

			const conn = (db as duckdb.Database).connect();

			conn.all(
				`
				CREATE TABLE vehicles (
					id VARCHAR PRIMARY KEY,
					plate_number VARCHAR,
					model VARCHAR,
					driver_name VARCHAR,
					status VARCHAR,
					created_at TIMESTAMP
				);

				CREATE TABLE customers (
					id VARCHAR PRIMARY KEY,
					name VARCHAR,
					contact VARCHAR,
					industry VARCHAR,
					created_at TIMESTAMP
				);

				CREATE TABLE routes (
					id VARCHAR PRIMARY KEY,
					name VARCHAR,
					origin VARCHAR,
					destination VARCHAR,
					distance_km DOUBLE,
					created_at TIMESTAMP
				);

				CREATE TABLE containers (
					id VARCHAR PRIMARY KEY,
					code VARCHAR,
					type VARCHAR,
					volume DOUBLE,
					status VARCHAR,
					created_at TIMESTAMP
				);

				CREATE TABLE shipments (
					id VARCHAR PRIMARY KEY,
					batch_no VARCHAR,
					vehicle_id VARCHAR,
					customer_id VARCHAR,
					route_id VARCHAR,
					container_id VARCHAR,
					departure_time TIMESTAMP,
					arrival_time TIMESTAMP,
					planned_arrival_time TIMESTAMP,
					status VARCHAR,
					created_at TIMESTAMP
				);

				CREATE TABLE temperature_records (
					id VARCHAR PRIMARY KEY,
					shipment_id VARCHAR,
					batch_no VARCHAR,
					probe_id VARCHAR,
					timestamp TIMESTAMP,
					temperature DOUBLE,
					humidity DOUBLE,
					latitude DOUBLE,
					longitude DOUBLE,
					door_open BOOLEAN,
					probe_calibrated BOOLEAN,
					probe_calibration_date TIMESTAMP,
					calibration_deviation DOUBLE,
					created_at TIMESTAMP
				);

				CREATE TABLE location_records (
					id VARCHAR PRIMARY KEY,
					shipment_id VARCHAR,
					timestamp TIMESTAMP,
					latitude DOUBLE,
					longitude DOUBLE,
					speed DOUBLE,
					created_at TIMESTAMP
				);

				CREATE TABLE door_events (
					id VARCHAR PRIMARY KEY,
					shipment_id VARCHAR,
					timestamp TIMESTAMP,
					event_type VARCHAR,
					location VARCHAR,
					operator VARCHAR,
					created_at TIMESTAMP
				);

				CREATE TABLE anomaly_records (
					id VARCHAR PRIMARY KEY,
					shipment_id VARCHAR,
					batch_no VARCHAR,
					start_time TIMESTAMP,
					end_time TIMESTAMP,
					duration_minutes INTEGER,
					anomaly_type VARCHAR,
					severity VARCHAR,
					responsible_party VARCHAR,
					status VARCHAR,
					resolved BOOLEAN,
					resolved_at TIMESTAMP,
					probe_calibrated BOOLEAN,
					description VARCHAR,
					annotation VARCHAR,
					created_at TIMESTAMP
				);
				`,
				(err) => {
					if (err) {
						reject(err);
						return;
					}

					const mockData = generateMockData();
					const promises: Promise<void>[] = [];

					promises.push(insertVehicles(mockData.vehicles));
					promises.push(insertCustomers(mockData.customers));
					promises.push(insertRoutes(mockData.routes));
					promises.push(insertContainers(mockData.containers));
					promises.push(insertShipments(mockData.shipments));
					promises.push(insertTemperatureRecords(mockData.temperatureRecords));
					promises.push(insertLocationRecords(mockData.locationRecords));
					promises.push(insertDoorEvents(mockData.doorEvents));
					promises.push(insertAnomalyRecords(mockData.anomalyRecords));

					Promise.all(promises).then(() => resolve(db as duckdb.Database)).catch(reject);
				}
			);
		});
	});
}

function getConnection(): duckdb.Connection {
	if (!db) throw new Error('Database not initialized');
	return db.connect();
}

function executeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
	return new Promise((resolve, reject) => {
		const conn = getConnection();
		conn.all(sql, params, (err: Error | null, rows: T[]) => {
			if (err) reject(err);
			else resolve(rows);
		});
	});
}

export async function insertVehicles(vehicles: Vehicle[]): Promise<void> {
	if (vehicles.length === 0) return;
	const values = vehicles
		.map(
			(v) =>
				`('${v.id}', '${v.plateNumber}', '${v.model}', '${v.driverName}', '${v.status}', '${v.createdAt.toISOString()}')`
		)
		.join(',');
	await executeQuery(
		`INSERT INTO vehicles (id, plate_number, model, driver_name, status, created_at) VALUES ${values}`
	);
}

export async function insertCustomers(customers: Customer[]): Promise<void> {
	if (customers.length === 0) return;
	const values = customers
		.map(
			(c) =>
				`('${c.id}', '${c.name}', '${c.contact || ''}', '${c.industry || ''}', '${c.createdAt.toISOString()}')`
		)
		.join(',');
	await executeQuery(
		`INSERT INTO customers (id, name, contact, industry, created_at) VALUES ${values}`
	);
}

export async function insertRoutes(routes: Route[]): Promise<void> {
	if (routes.length === 0) return;
	const values = routes
		.map(
			(r) =>
				`('${r.id}', '${r.name}', '${r.origin}', '${r.destination}', ${r.distanceKm}, '${r.createdAt.toISOString()}')`
		)
		.join(',');
	await executeQuery(
		`INSERT INTO routes (id, name, origin, destination, distance_km, created_at) VALUES ${values}`
	);
}

export async function insertContainers(containers: Container[]): Promise<void> {
	if (containers.length === 0) return;
	const values = containers
		.map(
			(c) =>
				`('${c.id}', '${c.code}', '${c.type}', ${c.volume}, '${c.status}', '${c.createdAt.toISOString()}')`
		)
		.join(',');
	await executeQuery(
		`INSERT INTO containers (id, code, type, volume, status, created_at) VALUES ${values}`
	);
}

export async function insertShipments(shipments: Shipment[]): Promise<void> {
	if (shipments.length === 0) return;
	const values = shipments
		.map((s) => {
			const arrivalTime = s.arrivalTime ? `'${s.arrivalTime.toISOString()}'` : 'NULL';
			return `('${s.id}', '${s.batchNo}', '${s.vehicleId}', '${s.customerId}', '${s.routeId}', '${s.containerId}', '${s.departureTime.toISOString()}', ${arrivalTime}, '${s.plannedArrivalTime.toISOString()}', '${s.status}', '${s.createdAt.toISOString()}')`;
		})
		.join(',');
	await executeQuery(
		`INSERT INTO shipments (id, batch_no, vehicle_id, customer_id, route_id, container_id, departure_time, arrival_time, planned_arrival_time, status, created_at) VALUES ${values}`
	);
}

export async function insertTemperatureRecords(records: TemperatureRecord[]): Promise<void> {
	if (records.length === 0) return;
	const values = records
		.map((r) => {
			const humidity = r.humidity !== undefined ? r.humidity : 'NULL';
			const lat = r.latitude !== undefined ? r.latitude : 'NULL';
			const lng = r.longitude !== undefined ? r.longitude : 'NULL';
			const doorOpen = r.doorOpen !== undefined ? r.doorOpen : 'FALSE';
			const calDate = r.probeCalibrationDate ? `'${r.probeCalibrationDate.toISOString()}'` : 'NULL';
			return `('${r.id}', '${r.shipmentId}', '${r.batchNo}', '${r.probeId}', '${r.timestamp.toISOString()}', ${r.temperature}, ${humidity}, ${lat}, ${lng}, ${doorOpen}, ${r.probeCalibrated}, ${calDate}, ${r.calibrationDeviation}, '${r.createdAt.toISOString()}')`;
		})
		.join(',');
	await executeQuery(
		`INSERT INTO temperature_records (id, shipment_id, batch_no, probe_id, timestamp, temperature, humidity, latitude, longitude, door_open, probe_calibrated, probe_calibration_date, calibration_deviation, created_at) VALUES ${values}`
	);
}

export async function insertLocationRecords(records: LocationRecord[]): Promise<void> {
	if (records.length === 0) return;
	const values = records
		.map((r) => {
			const speed = r.speed !== undefined ? r.speed : 'NULL';
			return `('${r.id}', '${r.shipmentId}', '${r.timestamp.toISOString()}', ${r.latitude}, ${r.longitude}, ${speed}, '${r.createdAt.toISOString()}')`;
		})
		.join(',');
	await executeQuery(
		`INSERT INTO location_records (id, shipment_id, timestamp, latitude, longitude, speed, created_at) VALUES ${values}`
	);
}

export async function insertDoorEvents(events: DoorEvent[]): Promise<void> {
	if (events.length === 0) return;
	const values = events
		.map((e) => {
			const loc = e.location ? `'${e.location}'` : 'NULL';
			const op = e.operator ? `'${e.operator}'` : 'NULL';
			return `('${e.id}', '${e.shipmentId}', '${e.timestamp.toISOString()}', '${e.eventType}', ${loc}, ${op}, '${e.createdAt.toISOString()}')`;
		})
		.join(',');
	await executeQuery(
		`INSERT INTO door_events (id, shipment_id, timestamp, event_type, location, operator, created_at) VALUES ${values}`
	);
}

export async function insertAnomalyRecords(records: AnomalyRecord[]): Promise<void> {
	if (records.length === 0) return;
	const values = records
		.map((r) => {
			const resolvedAt = r.resolvedAt ? `'${r.resolvedAt}'` : 'NULL';
			const annotation = r.annotation ? `'${r.annotation.replace(/'/g, "''")}'` : 'NULL';
			return `('${r.id}', '${r.shipmentId}', '${r.batchNo}', '${r.startTime.toISOString()}', '${r.endTime.toISOString()}', ${r.durationMinutes}, '${r.anomalyType}', '${r.severity}', '${r.responsibleParty}', '${r.status}', ${r.resolved}, ${resolvedAt}, ${r.probeCalibrated}, '${r.description.replace(/'/g, "''")}', ${annotation}, '${r.createdAt.toISOString()}')`;
		})
		.join(',');
	await executeQuery(
		`INSERT INTO anomaly_records (id, shipment_id, batch_no, start_time, end_time, duration_minutes, anomaly_type, severity, responsible_party, status, resolved, resolved_at, probe_calibrated, description, annotation, created_at) VALUES ${values}`
	);
}

export async function getShipments(filters?: any): Promise<any[]> {
	let where = '1=1';
	const params: any[] = [];

	if (filters?.vehicleIds?.length) {
		where += ` AND vehicle_id IN (${filters.vehicleIds.map(() => '?').join(',')})`;
		params.push(...filters.vehicleIds);
	}
	if (filters?.customerIds?.length) {
		where += ` AND customer_id IN (${filters.customerIds.map(() => '?').join(',')})`;
		params.push(...filters.customerIds);
	}
	if (filters?.routeIds?.length) {
		where += ` AND route_id IN (${filters.routeIds.map(() => '?').join(',')})`;
		params.push(...filters.routeIds);
	}
	if (filters?.batchNos?.length) {
		where += ` AND batch_no IN (${filters.batchNos.map(() => '?').join(',')})`;
		params.push(...filters.batchNos);
	}

	return executeQuery(
		`
		SELECT s.*, 
			v.plate_number as vehicle_plate,
			c.name as customer_name,
			r.name as route_name,
			ct.code as container_code
		FROM shipments s
		LEFT JOIN vehicles v ON s.vehicle_id = v.id
		LEFT JOIN customers c ON s.customer_id = c.id
		LEFT JOIN routes r ON s.route_id = r.id
		LEFT JOIN containers ct ON s.container_id = ct.id
		WHERE ${where}
		ORDER BY s.departure_time DESC
		`,
		params
	);
}

export async function getAnomalies(filters?: any): Promise<any[]> {
	let where = '1=1';
	const params: any[] = [];

	if (filters?.anomalyTypes?.length) {
		where += ` AND anomaly_type IN (${filters.anomalyTypes.map(() => '?').join(',')})`;
		params.push(...filters.anomalyTypes);
	}
	if (filters?.severityLevels?.length) {
		where += ` AND severity IN (${filters.severityLevels.map(() => '?').join(',')})`;
		params.push(...filters.severityLevels);
	}
	if (filters?.vehicleIds?.length) {
		where += ` AND shipment_id IN (SELECT id FROM shipments WHERE vehicle_id IN (${filters.vehicleIds.map(() => '?').join(',')}))`;
		params.push(...filters.vehicleIds);
	}
	if (filters?.customerIds?.length) {
		where += ` AND shipment_id IN (SELECT id FROM shipments WHERE customer_id IN (${filters.customerIds.map(() => '?').join(',')}))`;
		params.push(...filters.customerIds);
	}

	return executeQuery(
		`
		SELECT a.*,
			s.vehicle_id,
			s.customer_id,
			s.route_id,
			s.container_id
		FROM anomaly_records a
		LEFT JOIN shipments s ON a.shipment_id = s.id
		WHERE ${where}
		ORDER BY a.start_time DESC
		`,
		params
	);
}

export async function getKPISummary(): Promise<any> {
	const result = await executeQuery(`
		SELECT
			(SELECT COUNT(*) FROM shipments) as total_shipments,
			(SELECT COUNT(*) FROM shipments WHERE status = 'in_transit') as active_shipments,
			(SELECT COUNT(*) FROM anomaly_records) as total_anomalies,
			(SELECT AVG(temperature) FROM temperature_records) as avg_temperature,
			(SELECT COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shipments) FROM shipments WHERE status != 'abnormal') as compliance_rate
	`);
	return result[0];
}

export async function getTemperatureRecords(shipmentId: string): Promise<any[]> {
	return executeQuery(
		`SELECT * FROM temperature_records WHERE shipment_id = ? ORDER BY timestamp ASC`,
		[shipmentId]
	);
}

export async function getVehicles(): Promise<any[]> {
	return executeQuery(`SELECT * FROM vehicles ORDER BY plate_number`);
}

export async function getCustomers(): Promise<any[]> {
	return executeQuery(`SELECT * FROM customers ORDER BY name`);
}

export async function getRoutes(): Promise<any[]> {
	return executeQuery(`SELECT * FROM routes ORDER BY name`);
}

export async function getContainers(): Promise<any[]> {
	return executeQuery(`SELECT * FROM containers ORDER BY code`);
}

export async function getShipmentById(id: string): Promise<any> {
	const result = await executeQuery(
		`
		SELECT s.*,
			v.plate_number as vehicle_plate,
			v.driver_name,
			c.name as customer_name,
			r.name as route_name,
			r.origin,
			r.destination,
			r.distance_km,
			ct.code as container_code
		FROM shipments s
		LEFT JOIN vehicles v ON s.vehicle_id = v.id
		LEFT JOIN customers c ON s.customer_id = c.id
		LEFT JOIN routes r ON s.route_id = r.id
		LEFT JOIN containers ct ON s.container_id = ct.id
		WHERE s.id = ?
		`,
		[id]
	);
	return result[0];
}
