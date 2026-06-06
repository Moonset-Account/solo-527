export type Direction = "up" | "down";

export type PeakPeriod = "morning" | "evening" | "off-peak";

export type CrowdingLevel = "low" | "medium" | "high" | "extreme";

export interface Route {
  id: string;
  name: string;
  code: string;
  color: string;
  stations: Station[];
  direction: Direction;
  totalStops: number;
  operatingHours: { start: string; end: string };
}

export interface Station {
  id: string;
  name: string;
  code: string;
  lng: number;
  lat: number;
  routes: string[];
  sequence: number;
}

export interface Trip {
  id: string;
  routeId: string;
  routeName: string;
  direction: Direction;
  startTime: string;
  endTime: string;
  vehicleId: string;
  driverName: string;
  isDetour: boolean;
  detourReason?: string;
  peakPeriod: PeakPeriod;
}

export interface ArrivalRecord {
  id: string;
  tripId: string;
  routeId: string;
  stationId: string;
  stationName: string;
  scheduledTime: string;
  actualTime: string;
  delaySeconds: number;
  loadFactor: number;
  passengerCount: number;
  crowdingLevel: CrowdingLevel;
  isDetour: boolean;
  timestamp: string;
}

export interface CardRecord {
  id: string;
  cardId: string;
  routeId: string;
  stationId: string;
  stationName: string;
  tripId: string;
  tapType: "on" | "off";
  timestamp: string;
  fare: number;
  passengerType: "adult" | "student" | "senior" | "child";
}

export interface Complaint {
  id: string;
  routeId: string;
  routeName: string;
  stationId?: string;
  stationName?: string;
  tripId?: string;
  category: "crowding" | "delay" | "driver" | "vehicle" | "other";
  description: string;
  timestamp: string;
  status: "open" | "resolved" | "closed";
  reporterContact?: string;
  notes?: string;
}

export interface WeatherRecord {
  id: string;
  timestamp: string;
  date: string;
  hour: number;
  condition: "sunny" | "cloudy" | "rainy" | "stormy" | "snowy";
  temperature: number;
  precipitation: number;
  windSpeed: number;
  visibility: number;
}

export interface ComparisonMetric {
  routeId: string;
  routeName: string;
  avgLoadFactor: number;
  avgDelaySeconds: number;
  onTimeRate: number;
  totalPassengers: number;
  complaintCount: number;
  peakLoadFactor: number;
}

export interface DetourInfo {
  id: string;
  tripId: string;
  routeId: string;
  originalRoute: string[];
  detourRoute: string[];
  reason: string;
  startTime: string;
  endTime: string;
  affectedStations: string[];
}

export interface Anomaly {
  id: string;
  type: "delay" | "crowding" | "complaint_spike" | "detour";
  routeId: string;
  stationId?: string;
  tripId?: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  description: string;
  notes?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}
