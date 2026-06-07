import type {
	Vehicle,
	Customer,
	Route,
	Container,
	Shipment,
	TemperatureRecord,
	AnomalyRecord,
	LocationRecord,
	DoorEvent,
	SavedView
} from '$lib/types';
import { generateMockData } from '$lib/data/mockData';

let duckdbModule: any = null;
let db: any = null;
let inMemoryData: ReturnType<typeof generateMockData> | null = null;
let savedViews: SavedView[] = [];
let dbInitialized = false;

async function loadDuckDBModule(): Promise<any> {
	if (duckdbModule) return duckdbModule;
	try {
		const mod = await import('duckdb');
		duckdbModule = mod.default || mod;
		return duckdbModule;
	} catch (e) {
		console.warn('DuckDB module not available, using in-memory store');
		throw e;
	}
}

async function initDuckDBNative(): Promise<boolean> {
	try {
		const mod = await loadDuckDBModule();
		const Database = mod.Database;
		if (!Database) {
			console.warn('DuckDB Database constructor not found');
			return false;
		}

		return new Promise((resolve) => {
			try {
				db = new Database(':memory:', (err: Error | null) => {
					if (err) {
						console.warn('DuckDB init failed:', err);
						resolve(false);
						return;
					}

					try {
						const conn = db.connect();
						createTablesAndInsertData(conn, resolve);
					} catch (e) {
						console.warn('DuckDB setup failed:', e);
						resolve(false);
					}
				});
			} catch (e) {
				console.warn('DuckDB constructor error:', e);
				resolve(false);
			}
		});
	} catch (e) {
		console.warn('DuckDB native init failed, using in-memory');
		return false;
	}
}

function createTablesAndInsertData(conn: any, done: (success: boolean) => void) {
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
		CREATE TABLE IF NOT EXISTS saved_views (
			id VARCHAR PRIMARY KEY,
			name VARCHAR,
			description VARCHAR,
			page VARCHAR,
			filters TEXT,
			chart_configs TEXT,
			created_by VARCHAR,
			created_at TIMESTAMP
		);
	`;

	conn.all(createTablesSQL, (err: Error | null) => {
		if (err) {
			console.warn('Create tables failed:', err);
			done(false);
			return;
		}

		const mockData = inMemoryData || generateMockData();
		inMemoryData = mockData;

		try {
			insertMockData(conn, mockData);
			done(true);
		} catch (e) {
			console.warn('Insert mock data failed:', e);
			done(false);
		}
	});
}

function formatDate(d: Date): string {
	return d.toISOString().slice(0, 19).replace('T', ' ');
}

function escapeStr(s: string): string {
	return s.replace(/'/g, "''");
}

function insertMockData(conn: any, mockData: ReturnType<typeof generateMockData>) {
	if (mockData.vehicles.length > 0) {
		const values = mockData.vehicles.map((v: Vehicle) =>
			`('${v.id}', '${escapeStr(v.plateNumber)}', '${escapeStr(v.model)}', '${escapeStr(v.driverName)}', '${v.status}', '${formatDate(v.createdAt)}')`
		).join(',');
		conn.all(`INSERT OR REPLACE INTO vehicles VALUES ${values}`, () => {});
	}

	if (mockData.customers.length > 0) {
		const values = mockData.customers.map((c: Customer) =>
			`('${c.id}', '${escapeStr(c.name)}', '${escapeStr(c.contact || '')}', '${escapeStr(c.industry || '')}', '${formatDate(c.createdAt)}')`
		).join(',');
		conn.all(`INSERT OR REPLACE INTO customers VALUES ${values}`, () => {});
	}

	if (mockData.routes.length > 0) {
		const values = mockData.routes.map((r: Route) =>
			`('${r.id}', '${escapeStr(r.name)}', '${escapeStr(r.origin)}', '${escapeStr(r.destination)}', ${r.distanceKm}, '${formatDate(r.createdAt)}')`
		).join(',');
		conn.all(`INSERT OR REPLACE INTO routes VALUES ${values}`, () => {});
	}

	if (mockData.containers.length > 0) {
		const values = mockData.containers.map((c: Container) =>
			`('${c.id}', '${escapeStr(c.code)}', '${escapeStr(c.type)}', ${c.volume}, '${c.status}', '${formatDate(c.createdAt)}')`
		).join(',');
		conn.all(`INSERT OR REPLACE INTO containers VALUES ${values}`, () => {});
	}

	if (mockData.shipments.length > 0) {
		const values = mockData.shipments.map((s: Shipment) => {
			const arrival = s.arrivalTime ? `'${formatDate(s.arrivalTime)}'` : 'NULL';
			return `('${s.id}', '${s.batchNo}', '${s.vehicleId}', '${s.customerId}', '${s.routeId}', '${s.containerId}', '${formatDate(s.departureTime)}', ${arrival}, '${formatDate(s.plannedArrivalTime)}', '${s.status}', '${formatDate(s.createdAt)}')`;
		}).join(',');
		conn.all(`INSERT OR REPLACE INTO shipments VALUES ${values}`, () => {});
	}

	if (mockData.temperatureRecords.length > 0) {
		const batchSize = 100;
		for (let i = 0; i < mockData.temperatureRecords.length; i += batchSize) {
			const batch = mockData.temperatureRecords.slice(i, i + batchSize);
			const values = batch.map((r: TemperatureRecord) => {
				const hum = r.humidity !== undefined ? r.humidity : 'NULL';
				const lat = r.latitude !== undefined ? r.latitude : 'NULL';
				const lng = r.longitude !== undefined ? r.longitude : 'NULL';
				const door = r.doorOpen !== undefined ? r.doorOpen : 'FALSE';
				const cal = r.probeCalibrationDate ? `'${formatDate(r.probeCalibrationDate)}'` : 'NULL';
				return `('${r.id}', '${r.shipmentId}', '${r.batchNo}', '${r.probeId}', '${formatDate(r.timestamp)}', ${r.temperature}, ${hum}, ${lat}, ${lng}, ${door}, ${r.probeCalibrated}, ${cal}, ${r.calibrationDeviation}, '${formatDate(r.createdAt)}')`;
			}).join(',');
			conn.all(`INSERT OR REPLACE INTO temperature_records VALUES ${values}`, () => {});
		}
	}

	if (mockData.anomalyRecords.length > 0) {
		const values = mockData.anomalyRecords.map((a: AnomalyRecord) => {
			const resAt = a.resolvedAt ? `'${a.resolvedAt.slice(0, 19).replace('T', ' ')}'` : 'NULL';
			const ann = a.annotation ? `'${escapeStr(a.annotation)}'` : 'NULL';
			return `('${a.id}', '${a.shipmentId}', '${a.batchNo}', '${formatDate(a.startTime)}', '${formatDate(a.endTime)}', ${a.durationMinutes}, '${a.anomalyType}', '${a.severity}', '${a.responsibleParty}', '${a.status}', ${a.resolved}, ${resAt}, ${a.probeCalibrated}, '${escapeStr(a.description)}', ${ann}, '${formatDate(a.createdAt)}')`;
		}).join(',');
		conn.all(`INSERT OR REPLACE INTO anomaly_records VALUES ${values}`, () => {});
	}
}

async function executeQuery<T = any>(sql: string): Promise<T[]> {
	if (db) {
		return new Promise((resolve, reject) => {
			try {
				const conn = db.connect();
				conn.all(sql, (err: Error | null, rows: T[]) => {
					if (err) {
						reject(err);
					} else {
						resolve(rows);
					}
				});
			} catch (e) {
				reject(e);
			}
		});
	}
	return [] as T[];
}

export async function initDB(): Promise<void> {
	if (dbInitialized) return;

	inMemoryData = generateMockData();
	savedViews = [];

	try {
		const success = await initDuckDBNative();
		if (success) {
			dbInitialized = true;
			console.log('DuckDB initialized successfully');
		} else {
			dbInitialized = true;
			console.log('Using in-memory data store');
		}
	} catch (e) {
		dbInitialized = true;
		console.log('Using in-memory data store (fallback)');
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
	if (db) {
		try {
			return await executeQuery('SELECT * FROM vehicles ORDER BY plate_number');
		} catch (e) {
			console.warn('DuckDB query failed, using in-memory:', e);
		}
	}
	return inMemoryData!.vehicles;
}

export async function getCustomers(): Promise<any[]> {
	ensureDataLoaded();
	if (db) {
		try {
			return await executeQuery('SELECT * FROM customers ORDER BY name');
		} catch (e) {
			console.warn('DuckDB query failed, using in-memory:', e);
		}
	}
	return inMemoryData!.customers;
}

export async function getRoutes(): Promise<any[]> {
	ensureDataLoaded();
	if (db) {
		try {
			return await executeQuery('SELECT * FROM routes ORDER BY name');
		} catch (e) {
			console.warn('DuckDB query failed, using in-memory:', e);
		}
	}
	return inMemoryData!.routes;
}

export async function getContainers(): Promise<any[]> {
	ensureDataLoaded();
	if (db) {
		try {
			return await executeQuery('SELECT * FROM containers ORDER BY code');
		} catch (e) {
			console.warn('DuckDB query failed, using in-memory:', e);
		}
	}
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

export async function insertTemperatureRecords(records: TemperatureRecord[]): Promise<boolean> {
	ensureDataLoaded();
	inMemoryData!.temperatureRecords.push(...records);
	return true;
}

export async function getSavedViews(): Promise<SavedView[]> {
	return savedViews;
}

export async function saveView(view: SavedView): Promise<SavedView> {
	const existing = savedViews.findIndex((v) => v.id === view.id);
	if (existing >= 0) {
		savedViews[existing] = view;
	} else {
		savedViews.push(view);
	}
	return view;
}

export async function deleteView(id: string): Promise<boolean> {
	const idx = savedViews.findIndex((v) => v.id === id);
	if (idx >= 0) {
		savedViews.splice(idx, 1);
		return true;
	}
	return false;
}
