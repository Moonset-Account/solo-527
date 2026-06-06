export interface Settings {
	lowTempThreshold: number;
	minSampleCount: number;
	lateDeliveryThreshold: number;
	exportTimeRange: string;
}

export interface LowTempBox {
	boxId: string;
	minTemperature: number;
	sampleCount: number;
	status: 'pending' | 'confirmed';
	deliveryMan: string;
	mealType: string;
}

export interface LateBuilding {
	buildingName: string;
	lateCount: number;
	avgDelayMinutes: number;
	onTimeRate: number;
}

export interface RefundRequest {
	id: string;
	applicant: string;
	reason: string;
	amount: number;
	status: 'pending' | 'approved' | 'rejected';
}

export interface PendingVisit {
	id: string;
	userName: string;
	deliveryDate: string;
	status: 'pending' | 'completed';
}

export interface OverviewData {
	date: string;
	stats: {
		lowTempBoxCount: number;
		lateDeliveryCount: number;
		refundRequestCount: number;
		pendingVisitCount: number;
	};
	lowTempBoxes: LowTempBox[];
	lateBuildings: LateBuilding[];
	refundRequests: RefundRequest[];
	pendingVisits: PendingVisit[];
}

export interface AnalysisItem {
	name: string;
	onTimeRate: number;
	lowTempCount: number;
	totalOrders: number;
	avgTemperature: number;
}

export interface BuildingHeatmap {
	buildingName: string;
	lat: number;
	lng: number;
	value: number;
}

export interface AnalysisData {
	dimension: 'deliveryMan' | 'mealType' | 'timeSlot' | 'building';
	data: AnalysisItem[];
	buildingHeatmap?: BuildingHeatmap[];
}

export interface TemperaturePoint {
	time: string;
	temperature: number;
	location?: { lat: number; lng: number };
}

export interface RoutePoint {
	time: string;
	location: { lat: number; lng: number };
	address: string;
}

export interface DeliveryPhoto {
	url: string;
	thumbnail: string;
	uploadTime: string;
}

export interface ExcludedSample {
	time: string;
	temperature: number;
	reason: string;
}

export interface DetailData {
	boxId: string;
	deliveryMan: string;
	mealType: string;
	deliveryDate: string;
	building: string;
	temperatureCurve: TemperaturePoint[];
	route: RoutePoint[];
	photos: DeliveryPhoto[];
	excludedSamples: ExcludedSample[];
}
