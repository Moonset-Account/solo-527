export interface Vehicle {
	id: string;
	plateNumber: string;
	model: string;
	driverName: string;
	status: 'active' | 'maintenance' | 'idle';
	createdAt: Date;
}

export interface Customer {
	id: string;
	name: string;
	contact?: string;
	industry?: string;
	createdAt: Date;
}

export interface Route {
	id: string;
	name: string;
	origin: string;
	destination: string;
	distanceKm: number;
	createdAt: Date;
}

export interface Container {
	id: string;
	code: string;
	type: string;
	volume: number;
	status: 'active' | 'maintenance' | 'idle';
	createdAt: Date;
}

export interface Probe {
	id: string;
	code: string;
	model: string;
	lastCalibrationDate?: Date;
	calibrationDeviation: number;
	isActive: boolean;
	createdAt: Date;
}

export interface Shipment {
	id: string;
	batchNo: string;
	vehicleId: string;
	customerId: string;
	routeId: string;
	containerId: string;
	departureTime: Date;
	arrivalTime?: Date;
	plannedArrivalTime: Date;
	status: 'in_transit' | 'completed' | 'delayed' | 'abnormal';
	createdAt: Date;
}

export interface TemperatureRecord {
	id: string;
	shipmentId: string;
	probeId: string;
	timestamp: Date;
	temperature: number;
	humidity?: number;
	probeCalibrated: boolean;
	probeCalibrationDate?: Date;
	calibrationDeviation: number;
	createdAt: Date;
}

export interface LocationRecord {
	id: string;
	shipmentId: string;
	timestamp: Date;
	latitude: number;
	longitude: number;
	speed?: number;
	createdAt: Date;
}

export interface DoorEvent {
	id: string;
	shipmentId: string;
	timestamp: Date;
	eventType: 'open' | 'close';
	location?: string;
	operator?: string;
	createdAt: Date;
}

export interface AnomalyRecord {
	id: string;
	shipmentId: string;
	startTime: Date;
	endTime: Date;
	durationMinutes: number;
	anomalyType: 'over_temp' | 'under_temp' | 'door_open' | 'probe_error' | 'delay';
	severity: 'low' | 'medium' | 'high' | 'critical';
	responsibleParty: 'carrier' | 'warehouse' | 'customer' | 'equipment' | 'unknown';
	status: 'pending' | 'confirmed' | 'resolved';
	annotation?: string;
	createdAt: Date;
}

export interface DataDictionaryItem {
	id: string;
	category: string;
	key: string;
	value: string;
	label?: string;
	description?: string;
	sortOrder: number;
	isActive: boolean;
	createdAt: Date;
}

export interface SavedView {
	id: string;
	name: string;
	description?: string;
	page: string;
	filters: FilterState;
	chartConfigs?: Record<string, any>;
	createdBy?: string;
	createdAt: string;
}

export interface FilterState {
	dateRange?: [Date, Date];
	vehicleIds: string[];
	customerIds: string[];
	routeIds: string[];
	batchNos: string[];
	anomalyTypes: string[];
	severityLevels: string[];
}

export interface User {
	id: string;
	username: string;
	role: 'admin' | 'analyst' | 'quality' | 'customer';
	customerId?: string;
	fullName?: string;
	email?: string;
	isActive: boolean;
	createdAt: Date;
}

export interface KPISummary {
	totalShipments: number;
	activeShipments: number;
	totalAnomalies: number;
	complianceRate: number;
	averageTemperature: number;
	avgDeliveryDelayMinutes: number;
	trends: {
		complianceRate: number[];
		anomalies: number[];
	};
}

export interface AnomalyDurationStats {
	type: string;
	label: string;
	totalMinutes: number;
	count: number;
	color: string;
	children?: AnomalyDurationStats[];
}

export interface ResponsibilitySegment {
	id: string;
	shipmentId: string;
	batchNo: string;
	party: 'carrier' | 'warehouse' | 'customer' | 'equipment' | 'unknown';
	partyLabel: string;
	startTime: Date;
	endTime: Date;
	durationMinutes: number;
	anomalyType: string;
	color: string;
}

export type { EChartsType } from 'echarts';
