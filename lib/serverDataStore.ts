import * as mockStore from "./dataStore";
import * as postgis from "./postgis";
import type {
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
import type { TimeWindow, StationCrowdingQuery } from "./dataStore";

const USE_POSTGIS = process.env.USE_POSTGIS === "true";
const POSTGIS_AVAILABLE = postgis.isPostGISEnabled();

export const DATA_SOURCE = USE_POSTGIS && POSTGIS_AVAILABLE ? "postgis" : "mock";

console.log(`[ServerDataStore] 数据源模式: ${DATA_SOURCE}`);

export async function getRoutes(): Promise<Route[]> {
  if (DATA_SOURCE === "postgis") {
    return postgis.getRoutes_PostGIS();
  }
  return mockStore.getRoutes();
}

export async function getRouteById(routeId: string): Promise<Route | undefined> {
  if (DATA_SOURCE === "postgis") {
    const routes = await postgis.getRoutes_PostGIS(routeId);
    return routes[0];
  }
  return mockStore.getRouteById(routeId);
}

export async function getStations(): Promise<Station[]> {
  if (DATA_SOURCE === "postgis") {
    return postgis.getStations_PostGIS();
  }
  return mockStore.getStations();
}

export async function getStationById(stationId: string): Promise<Station | undefined> {
  if (DATA_SOURCE === "postgis") {
    const stations = await postgis.getStations_PostGIS(stationId);
    return stations[0];
  }
  return mockStore.getStationById(stationId);
}

export async function getStationsByRoute(routeId: string): Promise<Station[]> {
  if (DATA_SOURCE === "postgis") {
    const route = await getRouteById(routeId);
    return route?.stations || [];
  }
  return mockStore.getStationsByRoute(routeId);
}

export async function getTrips(
  routeId?: string,
  includeDetour: boolean = true,
  window?: TimeWindow
): Promise<Trip[]> {
  if (DATA_SOURCE === "postgis") {
    return postgis.getTrips_PostGIS(routeId, includeDetour, window);
  }
  return mockStore.getTrips(routeId, includeDetour, window);
}

export async function getTripById(tripId: string): Promise<Trip | undefined> {
  if (DATA_SOURCE === "postgis") {
    const trips = await postgis.getTrips_PostGIS();
    return trips.find((t) => t.id === tripId);
  }
  return mockStore.getTripById(tripId);
}

export async function getArrivalRecords(
  routeId?: string,
  stationId?: string,
  tripId?: string,
  includeDetour: boolean = true,
  window?: TimeWindow
): Promise<ArrivalRecord[]> {
  if (DATA_SOURCE === "postgis") {
    return postgis.getArrivalRecords_PostGIS(routeId, stationId, tripId, includeDetour, window);
  }
  return mockStore.getArrivalRecords(routeId, stationId, tripId, includeDetour, window);
}

export async function getCardRecords(
  routeId?: string,
  stationId?: string,
  tripId?: string,
  window?: TimeWindow
): Promise<CardRecord[]> {
  if (DATA_SOURCE === "postgis") {
    return postgis.getCardRecords_PostGIS(routeId, stationId, tripId, window);
  }
  return mockStore.getCardRecords(routeId, stationId, tripId, window);
}

export async function getComplaints(
  routeId?: string,
  status?: Complaint["status"],
  category?: Complaint["category"],
  window?: TimeWindow
): Promise<Complaint[]> {
  if (DATA_SOURCE === "postgis") {
    return postgis.getComplaints_PostGIS(routeId, status, category, window);
  }
  return mockStore.getComplaints(routeId, status, category, window);
}

export async function getWeatherRecords(
  date?: string,
  startHour?: number,
  endHour?: number
): Promise<WeatherRecord[]> {
  if (DATA_SOURCE === "postgis") {
    return postgis.getWeatherRecords_PostGIS(date, startHour, endHour);
  }
  return mockStore.getWeatherRecords(date, startHour, endHour);
}

export async function getAnomalies(
  routeId?: string,
  type?: Anomaly["type"],
  resolved?: boolean,
  window?: TimeWindow
): Promise<Anomaly[]> {
  if (DATA_SOURCE === "postgis") {
    return postgis.getAnomalies_PostGIS(routeId, type, resolved, window);
  }
  return mockStore.getAnomalies(routeId, type, resolved, window);
}

export async function getDetourInfos(
  routeId?: string,
  window?: TimeWindow
): Promise<DetourInfo[]> {
  if (DATA_SOURCE === "postgis") {
    return postgis.getDetourInfos_PostGIS(routeId, window);
  }
  return mockStore.getDetourInfos(routeId, window);
}

export async function calculateComparisonMetrics(
  routeIds: string[],
  peakPeriod?: PeakPeriod,
  window?: TimeWindow
): Promise<ComparisonMetric[]> {
  if (DATA_SOURCE === "postgis") {
    return postgis.calculateComparisonMetrics_PostGIS(routeIds, peakPeriod, window);
  }

  const trips = mockStore.getData().trips;
  const metrics: ComparisonMetric[] = [];

  for (const routeId of routeIds) {
    const routes = await getRoutes();
    const route = routes.find((r) => r.id === routeId);
    if (!route) continue;

    let routeTrips = trips.filter((t) => t.routeId === routeId);
    if (peakPeriod) {
      routeTrips = routeTrips.filter((t) => t.peakPeriod === peakPeriod);
    }

    const regularTrips = routeTrips.filter((t) => !t.isDetour);
    const regularTripIds = regularTrips.map((t) => t.id);
    let arrivals = await getArrivalRecords(routeId, undefined, undefined, false, window);
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
      continue;
    }

    const avgLoadFactor =
      arrivals.reduce((sum, a) => sum + a.loadFactor, 0) / arrivals.length;
    const avgDelaySeconds =
      arrivals.reduce((sum, a) => sum + a.delaySeconds, 0) / arrivals.length;
    const onTimeCount = arrivals.filter((a) => a.delaySeconds <= 120).length;
    const onTimeRate = onTimeCount / arrivals.length;
    const totalPassengers = arrivals.reduce((sum, a) => sum + a.passengerCount, 0);
    const peakLoadFactor = Math.max(...arrivals.map((a) => a.loadFactor));
    const routeComplaints = await getComplaints(routeId, undefined, undefined, window);
    const complaintCount = routeComplaints.length;

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
  }

  return metrics;
}

export async function getStationCrowdingData(
  query?: StationCrowdingQuery
): Promise<
  Array<{
    stationId: string;
    stationName: string;
    lng: number;
    lat: number;
    avgLoadFactor: number;
    crowdingLevel: string;
    totalPassengers: number;
    arrivalCount: number;
  }>
> {
  if (DATA_SOURCE === "postgis") {
    return postgis.getStationCrowdingData_PostGIS(query?.window, query?.routeId);
  }
  return mockStore.getStationCrowdingData(query);
}

export async function getHourlyTrendData(
  routeId?: string,
  window?: TimeWindow
): Promise<
  Array<{
    hour: number;
    hourLabel: string;
    passengers: number;
    arrivalCount: number;
    avgLoadFactor: number;
    avgDelaySeconds: number;
    onTimeRate: number;
    complaintCount: number;
  }>
> {
  const arrivals = await getArrivalRecords(routeId, undefined, undefined, false, window);
  const complaints = await getComplaints(routeId, undefined, undefined, window);

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

export async function updateAnomalyNote(
  anomalyId: string,
  notes: string,
  resolvedBy: string
): Promise<Anomaly | null> {
  if (DATA_SOURCE === "postgis") {
    return postgis.updateAnomalyNote_PostGIS(anomalyId, notes, resolvedBy);
  }
  return mockStore.updateAnomalyNote(anomalyId, notes, resolvedBy);
}

export async function getArrivalIntervalData(
  routeId: string,
  stationId: string,
  window?: TimeWindow
): Promise<
  Array<{
    hour: number;
    intervals: number[];
    q1: number;
    median: number;
    q3: number;
    min: number;
    max: number;
    count: number;
  }>
> {
  const arrivals = (
    await getArrivalRecords(routeId, stationId, undefined, false, window)
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

export async function getDrillDownData(
  level: "route" | "station" | "trip" | "record",
  id: string,
  window?: TimeWindow
) {
  switch (level) {
    case "route": {
      const route = await getRouteById(id);
      const stations = await getStationsByRoute(id);
      const trips = await getTrips(id, true, window);
      const arrivals = await getArrivalRecords(id, undefined, undefined, false, window);
      const complaints = await getComplaints(id, undefined, undefined, window);
      const metricsList = await calculateComparisonMetrics([id], undefined, window);
      const metrics = metricsList[0];

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
      const station = await getStationById(id);
      const arrivals = await getArrivalRecords(undefined, id, undefined, false, window);
      const cards = await getCardRecords(undefined, id, undefined, window);
      const allComplaints = await getComplaints(undefined, undefined, undefined, window);
      const complaints = allComplaints.filter((c) => c.stationId === id);
      const routeIds = [...new Set(arrivals.map((a) => a.routeId))];
      const routes = [];
      for (const rid of routeIds) {
        const r = await getRouteById(rid);
        if (r) routes.push(r);
      }

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
      const trip = await getTripById(id);
      const arrivals = await getArrivalRecords(undefined, undefined, id, true, window);
      const cards = await getCardRecords(undefined, undefined, id, window);
      const route = trip ? await getRouteById(trip.routeId) : undefined;
      const allComplaints = await getComplaints(undefined, undefined, undefined, window);
      const complaints = allComplaints.filter((c) => c.tripId === id);

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
      const allArrivals = await getArrivalRecords();
      const arrival = allArrivals.find((a) => a.id === id);
      if (!arrival) return null;

      const trip = await getTripById(arrival.tripId);
      const station = await getStationById(arrival.stationId);
      const route = await getRouteById(arrival.routeId);
      const cards = await getCardRecords(
        arrival.routeId,
        arrival.stationId,
        arrival.tripId,
        window
      );
      const relatedComplaintsAll = await getComplaints(
        arrival.routeId,
        undefined,
        undefined,
        window
      );
      const relatedComplaints = relatedComplaintsAll.filter(
        (c) => c.stationId === arrival.stationId
      );

      return {
        level: "record" as const,
        arrival,
        trip,
        station,
        route,
        cards,
        relatedComplaints,
        relatedRecords: (
          await getArrivalRecords(
            arrival.routeId,
            arrival.stationId,
            undefined,
            false,
            window
          )
        ).slice(0, 10),
      };
    }
    default:
      return null;
  }
}

export { testPostGISConnection, isPostGISEnabled } from "./postgis";
export type { TimeWindow, StationCrowdingQuery } from "./dataStore";
