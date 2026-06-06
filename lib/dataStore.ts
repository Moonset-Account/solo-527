import { generateAllData } from "./mockData";
import {
  Route,
  Station,
  Trip,
  ArrivalRecord,
  CardRecord,
  Complaint,
  WeatherRecord,
  Anomaly,
  DetourInfo,
  ComparisonMetric,
  PeakPeriod,
} from "@/types";

let cachedData: ReturnType<typeof generateAllData> | null = null;

export function getData() {
  if (!cachedData) {
    cachedData = generateAllData();
  }
  return cachedData;
}

export function getRoutes(): Route[] {
  return getData().routes;
}

export function getStations(): Station[] {
  return getData().stations;
}

export function getTrips(routeId?: string): Trip[] {
  const { trips } = getData();
  if (routeId) {
    return trips.filter((t) => t.routeId === routeId);
  }
  return trips;
}

export function getArrivalRecords(
  routeId?: string,
  stationId?: string,
  tripId?: string,
  includeDetour: boolean = true
): ArrivalRecord[] {
  let { arrivalRecords } = getData();
  if (!includeDetour) {
    arrivalRecords = arrivalRecords.filter((a) => !a.isDetour);
  }
  if (routeId) {
    arrivalRecords = arrivalRecords.filter((a) => a.routeId === routeId);
  }
  if (stationId) {
    arrivalRecords = arrivalRecords.filter((a) => a.stationId === stationId);
  }
  if (tripId) {
    arrivalRecords = arrivalRecords.filter((a) => a.tripId === tripId);
  }
  return arrivalRecords;
}

export function getCardRecords(
  routeId?: string,
  stationId?: string,
  tripId?: string
): CardRecord[] {
  let { cardRecords } = getData();
  if (routeId) {
    cardRecords = cardRecords.filter((c) => c.routeId === routeId);
  }
  if (stationId) {
    cardRecords = cardRecords.filter((c) => c.stationId === stationId);
  }
  if (tripId) {
    cardRecords = cardRecords.filter((c) => c.tripId === tripId);
  }
  return cardRecords;
}

export function getComplaints(
  routeId?: string,
  status?: Complaint["status"]
): Complaint[] {
  let { complaints } = getData();
  if (routeId) {
    complaints = complaints.filter((c) => c.routeId === routeId);
  }
  if (status) {
    complaints = complaints.filter((c) => c.status === status);
  }
  return complaints;
}

export function getWeatherRecords(date?: string): WeatherRecord[] {
  let { weatherRecords } = getData();
  if (date) {
    weatherRecords = weatherRecords.filter((w) => w.date === date);
  }
  return weatherRecords;
}

export function getAnomalies(
  routeId?: string,
  type?: Anomaly["type"],
  resolved?: boolean
): Anomaly[] {
  let { anomalies } = getData();
  if (routeId) {
    anomalies = anomalies.filter((a) => a.routeId === routeId);
  }
  if (type) {
    anomalies = anomalies.filter((a) => a.type === type);
  }
  if (resolved !== undefined) {
    anomalies = anomalies.filter((a) => a.resolved === resolved);
  }
  return anomalies;
}

export function getDetourInfos(routeId?: string): DetourInfo[] {
  let { detourInfos } = getData();
  if (routeId) {
    detourInfos = detourInfos.filter((d) => d.routeId === routeId);
  }
  return detourInfos;
}

export function calculateComparisonMetrics(
  routeIds: string[],
  peakPeriod?: PeakPeriod
): ComparisonMetric[] {
  const { trips } = getData();
  const metrics: ComparisonMetric[] = [];

  routeIds.forEach((routeId) => {
    const route = getRoutes().find((r) => r.id === routeId);
    if (!route) return;

    let routeTrips = trips.filter((t) => t.routeId === routeId);
    if (peakPeriod) {
      routeTrips = routeTrips.filter((t) => t.peakPeriod === peakPeriod);
    }

    const regularTrips = routeTrips.filter((t) => !t.isDetour);
    const regularTripIds = regularTrips.map((t) => t.id);
    const arrivals = getArrivalRecords(routeId).filter((a) =>
      regularTripIds.includes(a.tripId)
    );

    if (arrivals.length === 0) {
      metrics.push({
        routeId,
        routeName: route.name,
        avgLoadFactor: 0,
        avgDelaySeconds: 0,
        onTimeRate: 0,
        totalPassengers: 0,
        complaintCount: 0,
        peakLoadFactor: 0,
      });
      return;
    }

    const avgLoadFactor =
      arrivals.reduce((sum, a) => sum + a.loadFactor, 0) / arrivals.length;
    const avgDelaySeconds =
      arrivals.reduce((sum, a) => sum + a.delaySeconds, 0) / arrivals.length;
    const onTimeCount = arrivals.filter((a) => a.delaySeconds <= 120).length;
    const onTimeRate = onTimeCount / arrivals.length;
    const totalPassengers = arrivals.reduce((sum, a) => sum + a.passengerCount, 0);
    const peakLoadFactor = Math.max(...arrivals.map((a) => a.loadFactor));
    const complaintCount = getComplaints(routeId).length;

    metrics.push({
      routeId,
      routeName: route.name,
      avgLoadFactor: Number(avgLoadFactor.toFixed(4)),
      avgDelaySeconds: Math.round(avgDelaySeconds),
      onTimeRate: Number(onTimeRate.toFixed(4)),
      totalPassengers,
      complaintCount,
      peakLoadFactor: Number(peakLoadFactor.toFixed(4)),
    });
  });

  return metrics;
}

export function getStationCrowdingData(
  date?: string,
  hour?: number
): Array<{
  stationId: string;
  stationName: string;
  lng: number;
  lat: number;
  avgLoadFactor: number;
  crowdingLevel: string;
  totalPassengers: number;
}> {
  const { arrivalRecords, stations } = getData();
  let records = arrivalRecords;

  if (hour !== undefined) {
    records = records.filter((r) => {
      const h = new Date(r.timestamp).getHours();
      return h === hour;
    });
  }

  const stationMap: Record<
    string,
    {
      totalLoad: number;
      count: number;
      passengers: number;
    }
  > = {};

  records.forEach((record) => {
    if (!stationMap[record.stationId]) {
      stationMap[record.stationId] = { totalLoad: 0, count: 0, passengers: 0 };
    }
    stationMap[record.stationId].totalLoad += record.loadFactor;
    stationMap[record.stationId].count += 1;
    stationMap[record.stationId].passengers += record.passengerCount;
  });

  return Object.entries(stationMap).map(([stationId, data]) => {
    const station = stations.find((s) => s.id === stationId);
    const avgLoad = data.totalLoad / data.count;
    let crowdingLevel = "low";
    if (avgLoad >= 0.9) crowdingLevel = "extreme";
    else if (avgLoad >= 0.7) crowdingLevel = "high";
    else if (avgLoad >= 0.4) crowdingLevel = "medium";

    return {
      stationId,
      stationName: station?.name || stationId,
      lng: station?.lng || 0,
      lat: station?.lat || 0,
      avgLoadFactor: Number(avgLoad.toFixed(4)),
      crowdingLevel,
      totalPassengers: data.passengers,
    };
  });
}

export function updateAnomalyNote(
  anomalyId: string,
  notes: string,
  resolvedBy: string
): Anomaly | null {
  const { anomalies } = getData();
  const anomaly = anomalies.find((a) => a.id === anomalyId);
  if (anomaly) {
    anomaly.notes = notes;
    anomaly.resolved = true;
    anomaly.resolvedBy = resolvedBy;
    anomaly.resolvedAt = new Date().toISOString();
    return anomaly;
  }
  return null;
}

export function getArrivalIntervalData(
  routeId: string,
  stationId: string
): Array<{
  hour: number;
  intervals: number[];
  q1: number;
  median: number;
  q3: number;
  min: number;
  max: number;
}> {
  const arrivals = getArrivalRecords(routeId, stationId).sort(
    (a, b) => new Date(a.actualTime).getTime() - new Date(b.actualTime).getTime()
  );

  const hourlyIntervals: Record<number, number[]> = {};

  for (let i = 1; i < arrivals.length; i++) {
    const prev = new Date(arrivals[i - 1].actualTime);
    const curr = new Date(arrivals[i].actualTime);
    const interval = (curr.getTime() - prev.getTime()) / 60000;
    const hour = curr.getHours();

    if (!hourlyIntervals[hour]) {
      hourlyIntervals[hour] = [];
    }
    hourlyIntervals[hour].push(interval);
  }

  return Object.entries(hourlyIntervals)
    .map(([hour, intervals]) => {
      const sorted = [...intervals].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)] || 0;
      const median = sorted[Math.floor(sorted.length * 0.5)] || 0;
      const q3 = sorted[Math.floor(sorted.length * 0.75)] || 0;
      const min = sorted[0] || 0;
      const max = sorted[sorted.length - 1] || 0;

      return {
        hour: parseInt(hour),
        intervals,
        q1: Number(q1.toFixed(1)),
        median: Number(median.toFixed(1)),
        q3: Number(q3.toFixed(1)),
        min: Number(min.toFixed(1)),
        max: Number(max.toFixed(1)),
      };
    })
    .sort((a, b) => a.hour - b.hour);
}
