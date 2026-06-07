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

interface Database {
	connect(): Connection;
	close(): void;
}

interface Connection {
	all(sql: string, params: any[], callback: (err: Error | null, rows: any[]) => void): void;
	all(sql: string, callback: (err: Error | null, rows: any[]) => void): void;
}

let db: Database | null = null;
let inMemoryData: ReturnType<typeof generateMockData> | null = null;

async function loadDuckDB(): Promise<typeof import('duckdb')> {
	try {
		const duckdb = await import('duckdb');
		return duckdb as any;
	} catch (e) {
		console.warn('DuckDB not available, using in-memory data store:', e);
		throw e;
	}
}

export async function initDB(): Promise<void> {
	if (inMemoryData) return;

	inMemoryData = generateMockData();

	try {
		const duckdb = await loadDuckDB();
		return new Promise((resolve, reject) => {
			const Database = (duckdb as any).Database || duckdb.default?.Database;
			if (!Database) {
				console.warn('DuckDB Database constructor not found, using in-memory store');
				resolve();
				return;
			}

			db = new Database(':memory:', (err: Error | null) => {
				if (err) {
					console.warn('DuckDB init failed, using in-memory store:', err);
					resolve();
					return;
				}

				try {
					const conn = (db as Database).connect();
					const createTablesSQL = `
						CREATE TABLE IF NOT EXISTS vehicles (
							id VARCHAR PRIMARY KEY,
							plate_number VARCHAR,
							model VARCHAR,
							driver_name VARCHAR,
							status VARCHAR,
							created_at TIMESTAMP
						);
						CREATE TABLE IF NOT EXISTS customers (
							id VARCHAR PRIMARY KEY,
							name VARCHAR,
							contact VARCHAR,
							industry VARCHAR,
							created_at TIMESTAMP
						);
						CREATE TABLE IF NOT EXISTS routes (
							id VARCHAR PRIMARY KEY,
							name VARCHAR,
							origin VARCHAR,
							destination VARCHAR,
							distance_km DOUBLE,
							created_at TIMESTAMP
						);
						CREATE TABLE IF NOT EXISTS containers (
							id VARCHAR PRIMARY KEY,
							code VARCHAR,
							type VARCHAR,
							volume DOUBLE,
							status VARCHAR,
							created_at TIMESTAMP
						);
						CREATE TABLE IF NOT EXISTS shipments (
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
						CREATE TABLE IF NOT EXISTS temperature_records (
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
						CREATE TABLE IF NOT EXISTS location_records (
							id VARCHAR PRIMARY KEY,
							shipment_id VARCHAR,
							timestamp TIMESTAMP,
							latitude DOUBLE,
							longitude DOUBLE,
							speed DOUBLE,
							created_at TIMESTAMP
						);
						CREATE TABLE IF NOT EXISTS door_events (
							id VARCHAR PRIMARY KEY,
							shipment_id VARCHAR,
							timestamp TIMESTAMP,
							event_type VARCHAR,
							location VARCHAR,
							operator VARCHAR,
							created_at TIMESTAMP
						);
						CREATE TABLE IF NOT EXISTS anomaly_records (
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
					`;

					conn.all(createTablesSQL, (err: Error | null) => {
						if (err) {
							console.warn('Create tables failed, using in-memory store:', err);
							resolve();
							return;
						}
						resolve();
					});
				} catch (e) {
					console.warn('DuckDB setup failed, using in-memory store:', e);
					resolve();
				}
			});
		});
	} catch (e) {
		console.warn('DuckDB not available, using in-memory data store');
	}
}

function ensureDataLoaded() {
	if (!inMemoryData) {
		inMemoryData = generateMockData();
	}
	return inMemoryData!;
}

export async function getVehicles(): Promise<any[]> {
	ensureDataLoaded();
	return inMemoryData!.vehicles;
}

export async function getCustomers(): Promise<any[]> {
	ensureDataLoaded();
	return inMemoryData!.customers;
}

export async function getRoutes(): Promise<any[]> {
	ensureDataLoaded();
	return inMemoryData!.routes;
}

export async function getContainers(): Promise<any[]> {
	ensureDataLoaded();
	return inMemoryData!.containers;
}

export async function getShipments(filters?: any): Promise<any[]> {
	ensureDataLoaded();
	let data = inMemoryData!.shipments.map((s: any) => {
		const vehicle = inMemoryData!.vehicles.find((v) => v.id === s.vehicleId);
		const customer = inMemoryData!.customers.find((c) => c.id === s.customerId);
		const route = inMemoryData!.routes.find((r) => r.id === s.routeId);
		const container = inMemoryData!.containers.find((c) => c.id === s.containerId);
		return {
			...s,
			vehicle_plate: vehicle?.plateNumber || '',
			customer_name: customer?.name || '',
			route_name: route?.name || '',
			container_code: container?.code || ''
		};
	});

	if (filters?.vehicleIds?.length) {
		data = data.filter((s: any) => filters.vehicleIds.includes(s.vehicleId));
	}
	if (filters?.customerIds?.length) {
		data = data.filter((s: any) => filters.customerIds.includes(s.customerId));
	}
	if (filters?.routeIds?.length) {
		data = data.filter((s: any) => filters.routeIds.includes(s.routeId));
	}
	if (filters?.batchNos?.length) {
		data = data.filter((s: any) => filters.batchNos.includes(s.batchNo));
	}

	return data.sort((a: any, b: any) => b.departureTime.getTime() - a.departureTime.getTime());
}

export async function getAnomalies(filters?: any): Promise<any[]> {
	ensureDataLoaded();
	let data = inMemoryData!.anomalyRecords.map((a: any) => {
		const shipment = inMemoryData!.shipments.find((s) => s.id === a.shipmentId);
		return {
			...a,
			vehicle_id: shipment?.vehicleId || '',
			customer_id: shipment?.customerId || '',
			route_id: shipment?.routeId || '',
			container_id: shipment?.containerId || ''
		};
	});

	if (filters?.anomalyTypes?.length) {
		data = data.filter((a: any) => filters.anomalyTypes.includes(a.anomalyType));
	}
	if (filters?.severityLevels?.length) {
		data = data.filter((a: any) => filters.severityLevels.includes(a.severity));
	}
	if (filters?.vehicleIds?.length) {
		data = data.filter((a: any) => filters.vehicleIds.includes(a.vehicle_id));
	}
	if (filters?.customerIds?.length) {
		data = data.filter((a: any) => filters.customerIds.includes(a.customer_id));
	}

	return data.sort((a: any, b: any) => b.startTime.getTime() - a.startTime.getTime());
}

export async function getKPISummary(): Promise<any> {
	ensureDataLoaded();
	const shipments = inMemoryData!.shipments;
	const anomalies = inMemoryData!.anomalyRecords;
	const tempRecords = inMemoryData!.temperatureRecords;

	const totalShipments = shipments.length;
	const activeShipments = shipments.filter((s: any) => s.status === 'in_transit').length;
	const totalAnomalies = anomalies.length;
	const avgTemp = tempRecords.length > 0
		? tempRecords.reduce((sum: number, r: any) => sum + r.temperature, 0) / tempRecords.length
		: 0;
	const normalShipments = shipments.filter((s: any) => s.status !== 'abnormal').length;
	const complianceRate = totalShipments > 0 ? (normalShipments / totalShipments) * 100 : 0;

	return {
		total_shipments: totalShipments,
		active_shipments: activeShipments,
		total_anomalies: totalAnomalies,
		avg_temperature: avgTemp,
		compliance_rate: complianceRate
	};
}

export async function getTemperatureRecords(shipmentId: string): Promise<any[]> {
	ensureDataLoaded();
	return inMemoryData!.temperatureRecords
		.filter((r: any) => r.shipmentId === shipmentId)
		.sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime());
}

export async function getShipmentById(id: string): Promise<any> {
	ensureDataLoaded();
	const shipment = inMemoryData!.shipments.find((s: any) => s.id === id);
	if (!shipment) return null;

	const vehicle = inMemoryData!.vehicles.find((v) => v.id === shipment.vehicleId);
	const customer = inMemoryData!.customers.find((c) => c.id === shipment.customerId);
	const route = inMemoryData!.routes.find((r) => r.id === shipment.routeId);
	const container = inMemoryData!.containers.find((c) => c.id === shipment.containerId);

	return {
		...shipment,
		vehicle_plate: vehicle?.plateNumber || '',
		driver_name: vehicle?.driverName || '',
		customer_name: customer?.name || '',
		route_name: route?.name || '',
		origin: route?.origin || '',
		destination: route?.destination || '',
		distance_km: route?.distanceKm || 0,
		container_code: container?.code || ''
	};
}
