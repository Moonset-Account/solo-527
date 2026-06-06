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
  CrowdingLevel,
} from "@/types";

let cachedData: ReturnType<typeof generateAllData> | null = null;

export function getData() {
  if (!cachedData) {
    cachedData = generateAllData();
  }
  return cachedData;
}

export function resetData() {
  cachedData = generateAllData();
  return cachedData;
}

export interface TimeWindow {
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  startHour?: number;
  endHour?: number;
  peakPeriod?: PeakPeriod | "all";
}

export function applyTimeWindow<T extends { timestamp: string }>(
  records: T[],
  window?: TimeWindow
): T[] {
  if (!window) return records;

  return records.filter((record) => {
    const recordDate = new Date(record.timestamp);
    const recordHour = recordDate.getHours();

    if (window.startDate) {
      const start = new Date(window.startDate);
      if (recordDate < start) return false;
    }
    if (window.endDate) {
      const end = new Date(window.endDate);
      end.setHours(23, 59, 59, 999);
      if (recordDate > end) return false;
    }
    if (window.startHour !== undefined) {
      if (recordHour < window.startHour) return false;
    }
    if (window.endHour !== undefined) {
      if (recordHour > window.endHour) return false;
    }
    if (window.peakPeriod && window.peakPeriod !== "all") {
      if (window.peakPeriod === "morning" && (recordHour < 7 || recordHour > 9)) {
        return false;
      }
      if (window.peakPeriod === "evening" && (recordHour < 17 || recordHour > 19)) {
        return false;
      }
      if (window.peakPeriod === "off-peak") {
        if ((recordHour >= 7 && recordHour <= 9) || (recordHour >= 17 && recordHour <= 19)) {
          return false;
        }
      }
    }

    return true;
  });
}

export function getRoutes(): Route[] {
  return getData().routes;
}

export function getRouteById(routeId: string): Route | undefined {
  return getRoutes().find((r) => r.id === routeId);
}

export function getStations(): Station[] {
  return getData().stations;
}

export function getStationById(stationId: string): Station | undefined {
  return getStations().find((s) => s.id === stationId);
}

export function getStationsByRoute(routeId: string): Station[] {
  const route = getRouteById(routeId);
  return route?.stations || [];
}

export function getTrips(
  routeId?: string,
  includeDetour: boolean = true,
  window?: TimeWindow
): Trip[] {
  let { trips } = getData();
  if (routeId) {
    trips = trips.filter((t) => t.routeId === routeId);
  }
  if (!includeDetour) {
    trips = trips.filter((t) => !t.isDetour);
  }
  if (window) {
    trips = trips.filter((trip) => {
      const tripDate = new Date(trip.startTime);
      if (window.startDate && tripDate < new Date(window.startDate)) return false;
      if (window.endDate) {
        const end = new Date(window.endDate);
        end.setHours(23, 59, 59, 999);
        if (tripDate > end) return false;
      }
      if (window.peakPeriod && window.peakPeriod !== "all") {
        return trip.peakPeriod === window.peakPeriod;
      }
      return true;
    });
  }
  return trips;
}

export function getTripById(tripId: string): Trip | undefined {
  return getData().trips.find((t) => t.id === tripId);
}

export function getArrivalRecords(
  routeId?: string,
  stationId?: string,
  tripId?: string,
  includeDetour: boolean = true,
  window?: TimeWindow
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
  if (window) {
    arrivalRecords = applyTimeWindow(arrivalRecords, window);
  }

  return arrivalRecords;
}

export function getCardRecords(
  routeId?: string,
  stationId?: string,
  tripId?: string,
  window?: TimeWindow
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
  if (window) {
    cardRecords = applyTimeWindow(cardRecords, window);
  }
  return cardRecords;
}

export function getComplaints(
  routeId?: string,
  status?: Complaint["status"],
  category?: Complaint["category"],
  window?: TimeWindow
): Complaint[] {
  let { complaints } = getData();
  if (routeId) {
    complaints = complaints.filter((c) => c.routeId === routeId);
  }
  if (status) {
    complaints = complaints.filter((c) => c.status === status);
  }
  if (category) {
    complaints = complaints.filter((c) => c.category === category);
  }
  if (window) {
    complaints = applyTimeWindow(complaints, window);
  }
  return complaints;
}

export function getWeatherRecords(
  date?: string,
  startHour?: number,
  endHour?: number
): WeatherRecord[] {
  let { weatherRecords } = getData();
  if (date) {
    weatherRecords = weatherRecords.filter((w) => w.date === date);
  }
  if (startHour !== undefined) {
    weatherRecords = weatherRecords.filter((w) => w.hour >= startHour);
  }
  if (endHour !== undefined) {
    weatherRecords = weatherRecords.filter((w) => w.hour <= endHour);
  }
  return weatherRecords;
}

export function getAnomalies(
  routeId?: string,
  type?: Anomaly["type"],
  resolved?: boolean,
  window?: TimeWindow
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
  if (window) {
    anomalies = applyTimeWindow(anomalies, window);
  }
  return anomalies;
}

export function getDetourInfos(routeId?: string, window?: TimeWindow): DetourInfo[] {
  let { detourInfos } = getData();
  if (routeId) {
    detourInfos = detourInfos.filter((d) => d.routeId === routeId);
  }
  if (window) {
    detourInfos = detourInfos.filter((d) => {
      const startTime = new Date(d.startTime);
      if (window.startDate && startTime < new Date(window.startDate)) return false;
      if (window.endDate) {
        const end = new Date(window.endDate);
        end.setHours(23, 59, 59, 999);
        if (startTime > end) return false;
      }
      return true;
    });
  }
  return detourInfos;
}

export function calculateComparisonMetrics(
  routeIds: string[],
  peakPeriod?: PeakPeriod,
  window?: TimeWindow
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
    let arrivals = getArrivalRecords(routeId, undefined, undefined, false, window);
    arrivals = arrivals.filter((a) => regularTripIds.includes(a.tripId));

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
    const complaintCount = getComplaints(routeId, undefined, undefined, window).length;

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

export interface StationCrowdingQuery {
  date?: string;
  hour?: number;
  startHour?: number;
  endHour?: number;
  routeId?: string;
  includeDetour?: boolean;
  window?: TimeWindow;
}

export function getStationCrowdingData(
  query?: StationCrowdingQuery
): Array<{
  stationId: string;
  stationName: string;
  lng: number;
  lat: number;
  avgLoadFactor: number;
  crowdingLevel: string;
  totalPassengers: number;
  arrivalCount: number;
}> {
  const { arrivalRecords, stations } = getData();
  let records = arrivalRecords;

  if (query) {
    if (query.includeDetour === false) {
      records = records.filter((r) => !r.isDetour);
    }
    if (query.routeId) {
      records = records.filter((r) => r.routeId === query.routeId);
    }
    if (query.hour !== undefined) {
      records = records.filter((r) => {
        const h = new Date(r.timestamp).getHours();
        return h === query.hour;
      });
    }
    if (query.startHour !== undefined) {
      records = records.filter((r) => {
        const h = new Date(r.timestamp).getHours();
        return h >= query.startHour!;
      });
    }
    if (query.endHour !== undefined) {
      records = records.filter((r) => {
        const h = new Date(r.timestamp).getHours();
        return h <= query.endHour!;
      });
    }
    if (query.window) {
      records = applyTimeWindow(records, query.window);
    }
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
    const avgLoad = data.count > 0 ? data.totalLoad / data.count : 0;
    let crowdingLevel: CrowdingLevel = "low";
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
      arrivalCount: data.count,
    };
  });
}

export function getHourlyTrendData(
  routeId?: string,
  window?: TimeWindow
): Array<{
  hour: number;
  hourLabel: string;
  passengers: number;
  arrivalCount: number;
  avgLoadFactor: number;
  avgDelaySeconds: number;
  onTimeRate: number;
  complaintCount: number;
}> {
  const arrivals = getArrivalRecords(routeId, undefined, undefined, false, window);
  const complaints = getComplaints(routeId, undefined, undefined, window);

  const hourlyData: Record<
    number,
    {
      passengers: number;
      arrivalCount: number;
      totalLoad: number;
      totalDelay: number;
      onTimeCount: number;
      complaintCount: number;
    }
  > = {};

  for (let h = 0; h < 24; h++) {
    hourlyData[h] = {
      passengers: 0,
      arrivalCount: 0,
      totalLoad: 0,
      totalDelay: 0,
      onTimeCount: 0,
      complaintCount: 0,
    };
  }

  arrivals.forEach((a) => {
    const h = new Date(a.timestamp).getHours();
    hourlyData[h].passengers += a.passengerCount;
    hourlyData[h].arrivalCount += 1;
    hourlyData[h].totalLoad += a.loadFactor;
    hourlyData[h].totalDelay += a.delaySeconds;
    if (a.delaySeconds <= 120) {
      hourlyData[h].onTimeCount += 1;
    }
  });

  complaints.forEach((c) => {
    const h = new Date(c.timestamp).getHours();
    hourlyData[h].complaintCount += 1;
  });

  return Object.entries(hourlyData)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      hourLabel: `${hour}:00`,
      passengers: data.passengers,
      arrivalCount: data.arrivalCount,
      avgLoadFactor:
        data.arrivalCount > 0
          ? Number((data.totalLoad / data.arrivalCount).toFixed(4))
          : 0,
      avgDelaySeconds:
        data.arrivalCount > 0
          ? Math.round(data.totalDelay / data.arrivalCount)
          : 0,
      onTimeRate:
        data.arrivalCount > 0
          ? Number((data.onTimeCount / data.arrivalCount).toFixed(4))
          : 0,
      complaintCount: data.complaintCount,
    }))
    .sort((a, b) => a.hour - b.hour);
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
  stationId: string,
  window?: TimeWindow
): Array<{
  hour: number;
  intervals: number[];
  q1: number;
  median: number;
  q3: number;
  min: number;
  max: number;
  count: number;
}> {
  const arrivals = getArrivalRecords(
    routeId,
    stationId,
    undefined,
    false,
    window
  ).sort((a, b) => new Date(a.actualTime).getTime() - new Date(b.actualTime).getTime());

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
        count: intervals.length,
      };
    })
    .sort((a, b) => a.hour - b.hour);
}

export function getDrillDownData(
  level: "route" | "station" | "trip" | "record",
  id: string,
  window?: TimeWindow
) {
  switch (level) {
    case "route": {
      const route = getRouteById(id);
      const stations = getStationsByRoute(id);
      const trips = getTrips(id, true, window);
      const arrivals = getArrivalRecords(id, undefined, undefined, false, window);
      const complaints = getComplaints(id, undefined, undefined, window);
      const metrics = calculateComparisonMetrics([id], undefined, window)[0];

      return {
        level: "route" as const,
        route,
        stations,
        trips,
        arrivals,
        complaints,
        metrics,
        stationCount: stations.length,
        tripCount: trips.length,
        detourCount: trips.filter((t) => t.isDetour).length,
      };
    }
    case "station": {
      const station = getStationById(id);
      const arrivals = getArrivalRecords(undefined, id, undefined, false, window);
      const cards = getCardRecords(undefined, id, undefined, window);
      const complaints = getComplaints(undefined, undefined, undefined, window).filter(
        (c) => c.stationId === id
      );
      const routeIds = [...new Set(arrivals.map((a) => a.routeId))];
      const routes = routeIds.map((rid) => getRouteById(rid)).filter(Boolean);

      const avgLoadFactor =
        arrivals.length > 0
          ? arrivals.reduce((sum, a) => sum + a.loadFactor, 0) / arrivals.length
          : 0;
      const avgDelay =
        arrivals.length > 0
          ? arrivals.reduce((sum, a) => sum + a.delaySeconds, 0) / arrivals.length
          : 0;
      const onTimeRate =
        arrivals.length > 0
          ? arrivals.filter((a) => a.delaySeconds <= 120).length / arrivals.length
          : 0;

      return {
        level: "station" as const,
        station,
        routes,
        arrivals,
        cards,
        complaints,
        stats: {
          totalPassengers: arrivals.reduce((sum, a) => sum + a.passengerCount, 0),
          avgLoadFactor: Number(avgLoadFactor.toFixed(4)),
          avgDelaySeconds: Math.round(avgDelay),
          onTimeRate: Number(onTimeRate.toFixed(4)),
          arrivalCount: arrivals.length,
          complaintCount: complaints.length,
          routeCount: routes.length,
        },
      };
    }
    case "trip": {
      const trip = getTripById(id);
      const arrivals = getArrivalRecords(undefined, undefined, id, true, window);
      const cards = getCardRecords(undefined, undefined, id, window);
      const route = trip ? getRouteById(trip.routeId) : undefined;
      const complaints = getComplaints(undefined, undefined, undefined, window).filter(
        (c) => c.tripId === id
      );

      return {
        level: "trip" as const,
        trip,
        route,
        arrivals,
        cards,
        complaints,
        stats: {
          totalPassengers: arrivals.reduce((sum, a) => sum + a.passengerCount, 0),
          avgLoadFactor:
            arrivals.length > 0
              ? Number(
                  (
                    arrivals.reduce((sum, a) => sum + a.loadFactor, 0) /
                    arrivals.length
                  ).toFixed(4)
                )
              : 0,
          avgDelaySeconds:
            arrivals.length > 0
              ? Math.round(
                  arrivals.reduce((sum, a) => sum + a.delaySeconds, 0) /
                    arrivals.length
                )
              : 0,
          stationCount: arrivals.length,
          passengerCount: cards.filter((c) => c.tapType === "on").length,
          isDetour: trip?.isDetour || false,
        },
      };
    }
    case "record": {
      const arrival = getArrivalRecords().find((a) => a.id === id);
      if (!arrival) return null;

      const trip = getTripById(arrival.tripId);
      const station = getStationById(arrival.stationId);
      const route = getRouteById(arrival.routeId);
      const cards = getCardRecords(
        arrival.routeId,
        arrival.stationId,
        arrival.tripId,
        window
      );
      const relatedComplaints = getComplaints(
        arrival.routeId,
        undefined,
        undefined,
        window
      ).filter((c) => c.stationId === arrival.stationId);

      return {
        level: "record" as const,
        arrival,
        trip,
        station,
        route,
        cards,
        relatedComplaints,
        relatedRecords: getArrivalRecords(
          arrival.routeId,
          arrival.stationId,
          undefined,
          false,
          window
        ).slice(0, 10),
      };
    }
    default:
      return null;
  }
}

export const CALIBER_DEFINITIONS = {
  onTimeRate: {
    name: "准点率",
    definition: "车辆实际到站时间与计划到站时间偏差不超过2分钟（120秒）视为准点",
    formula: "准点到站次数 / 总到站次数 × 100%",
    excludeDetour: true,
    note: "临时绕行班次不参与准点率计算",
  },
  loadFactor: {
    name: "满载率",
    definition: "车辆实际载客量与车辆额定载客量的比值",
    formula: "实际乘客数 / 额定载客数 × 100%",
    levels: {
      low: "< 40% 宽松",
      medium: "40% - 69% 适中",
      high: "70% - 89% 拥挤",
      extreme: "≥ 90% 极度拥挤",
    },
  },
  peakPeriod: {
    name: "高峰时段",
    morning: "7:00 - 9:00",
    evening: "17:00 - 19:00",
    offPeak: "其余时段为平峰",
  },
  arrivalInterval: {
    name: "到站间隔",
    definition: "同线路同方向相邻两个班次到达同一站点的时间差",
    unit: "分钟",
  },
  detour: {
    name: "临时绕行",
    definition: "因道路施工、交通事故、交通管制等原因临时调整线路走向的班次",
    exclusion: "不参与常规准点率、运行间隔等指标统计",
  },
  dataSources: ["GPS定位系统", "IC卡刷卡系统", "乘客投诉平台", "气象数据接口"],
};
