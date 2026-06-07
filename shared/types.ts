export interface Vehicle {
  id: string;
  plateNumber: string;
  driverName: string;
  status: 'running' | 'idle' | 'maintenance';
}

export interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm: number;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  contact: string;
}

export interface TemperatureRecord {
  id: string;
  vehicleId: string;
  batchId: string;
  timestamp: number;
  temperature: number;
  probeId: string;
  isNormal: boolean;
}

export interface PositionRecord {
  id: string;
  vehicleId: string;
  timestamp: number;
  lat: number;
  lng: number;
  speed: number;
}

export interface DoorRecord {
  id: string;
  vehicleId: string;
  batchId: string;
  openTime: number;
  closeTime: number;
  duration: number;
  operator: string;
}

export interface DeliveryBatch {
  id: string;
  vehicleId: string;
  routeId: string;
  customerId: string;
  startTime: number;
  estimatedArrival: number;
  actualArrival: number | null;
  status: 'pending' | 'in_transit' | 'delivered' | 'exception';
}

export interface TemperatureProbe {
  id: string;
  vehicleId: string;
  boxId: string;
  lastCalibrationDate: number;
  nextCalibrationDate: number;
  calibrationStatus: 'valid' | 'expiring' | 'expired';
}

export interface AnomalyEvent {
  id: string;
  batchId: string;
  vehicleId: string;
  type: 'temp_high' | 'temp_low' | 'door_open' | 'delay';
  startTime: number;
  endTime: number | null;
  duration: number;
  severity: 'low' | 'medium' | 'high';
  responsible: string;
  status: 'pending' | 'processing' | 'resolved';
  description?: string;
}

export interface KPIData {
  activeVehicles: number;
  temperatureAnomalyRate: number;
  avgDeliveryDuration: number;
  onTimeRate: number;
  pendingAnomalies: number;
}

export interface AnomalyStatistics {
  dimension: string;
  dimensionValue: string;
  totalAnomalyDuration: number;
  anomalyCount: number;
}

export interface DataQualityReport {
  updateTime: number;
  completeness: number;
  missingFields: { field: string; missingCount: number }[];
  anomalyPoints: number;
  sampleSize: { dimension: string; count: number }[];
  isUpdateFailed: boolean;
  errorMessage?: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  userId: string;
  filters: Record<string, any>;
  createdAt: number;
}

export interface CompareMetrics {
  dimension: string;
  items: {
    id: string;
    name: string;
    avgTemperature: number;
    anomalyCount: number;
    onTimeRate: number;
    avgDuration: number;
  }[];
}

export interface DataQualityLog {
  id: string;
  dataDate: string;
  updateTime: number;
  completeness: number;
  missingFields: { field: string; missingCount: number }[];
  anomalyPoints: number;
  isUpdateFailed: boolean;
  errorMessage: string | null;
}
