import { Pool, QueryResult } from "pg";
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
import { TimeWindow } from "./dataStore";

const USE_POSTGIS = process.env.USE_POSTGIS === "true";
const DATABASE_URL = process.env.DATABASE_URL || "";

let pool: Pool | null = null;

if (USE_POSTGIS && DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
  });
  console.log("[PostGIS] 已启用 PostGIS 数据库模式");
} else {
  console.log("[PostGIS] 使用内存模拟模式（设置 USE_POSTGIS=true 启用真实数据库）");
}

async function query(sql: string, params?: any[]): Promise<QueryResult> {
  if (!pool) {
    throw new Error("PostGIS 数据库未连接，设置 USE_POSTGIS=true 和 DATABASE_URL 启用");
  }
  return pool.query(sql, params);
}

export async function getRoutes_PostGIS(routeId?: string): Promise<Route[]> {
  if (!pool) return [];

  let sql = `
    SELECT
      r.id,
      r.name,
      r.code,
      r.color,
      r.direction,
      r.total_stops as "totalStops",
      r.operating_start_time as "operatingStartTime",
      r.operating_end_time as "operatingEndTime",
      ST_AsGeoJSON(r.geom) as geom,
      json_agg(
        json_build_object(
          'id', s.id,
          'name', s.name,
          'code', s.code,
          'lng', ST_X(s.geom),
          'lat', ST_Y(s.geom),
          'sequence', rs.sequence,
          'routes', array(SELECT route_id FROM route_stations WHERE station_id = s.id)
        ) ORDER BY rs.sequence
      ) as stations
    FROM routes r
    LEFT JOIN route_stations rs ON r.id = rs.route_id
    LEFT JOIN stations s ON rs.station_id = s.id
    ${routeId ? "WHERE r.id = $1" : ""}
    GROUP BY r.id, r.name, r.code, r.color, r.direction, r.total_stops, r.operating_start_time, r.operating_end_time, r.geom
  `;

  const result = await query(sql, routeId ? [routeId] : []);
  return result.rows.map((row) => ({
    ...row,
    operatingHours: {
      start: row.operatingStartTime?.toString().slice(0, 5) || "06:00",
      end: row.operatingEndTime?.toString().slice(0, 5) || "22:00",
    },
  }));
}

export async function getStations_PostGIS(stationId?: string): Promise<Station[]> {
  if (!pool) return [];

  let sql = `
    SELECT
      s.id,
      s.name,
      s.code,
      ST_X(s.geom) as lng,
      ST_Y(s.geom) as lat,
      array(SELECT route_id FROM route_stations WHERE station_id = s.id) as routes,
      0 as sequence
    FROM stations s
    ${stationId ? "WHERE s.id = $1" : ""}
  `;

  const result = await query(sql, stationId ? [stationId] : []);
  return result.rows;
}

export async function getArrivalRecords_PostGIS(
  routeId?: string,
  stationId?: string,
  tripId?: string,
  includeDetour: boolean = true,
  window?: TimeWindow
): Promise<ArrivalRecord[]> {
  if (!pool) return [];

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (!includeDetour) {
    conditions.push(`a.is_detour = FALSE`);
  }
  if (routeId) {
    conditions.push(`a.route_id = $${paramIndex++}`);
    params.push(routeId);
  }
  if (stationId) {
    conditions.push(`a.station_id = $${paramIndex++}`);
    params.push(stationId);
  }
  if (tripId) {
    conditions.push(`a.trip_id = $${paramIndex++}`);
    params.push(tripId);
  }
  if (window) {
    if (window.startDate) {
      conditions.push(`a.timestamp >= $${paramIndex++}`);
      params.push(window.startDate);
    }
    if (window.endDate) {
      conditions.push(`a.timestamp <= $${paramIndex++}`);
      params.push(window.endDate + " 23:59:59");
    }
    if (window.startHour !== undefined) {
      conditions.push(`EXTRACT(HOUR FROM a.timestamp) >= $${paramIndex++}`);
      params.push(window.startHour);
    }
    if (window.endHour !== undefined) {
      conditions.push(`EXTRACT(HOUR FROM a.timestamp) <= $${paramIndex++}`);
      params.push(window.endHour);
    }
    if (window.peakPeriod && window.peakPeriod !== "all") {
      if (window.peakPeriod === "morning") {
        conditions.push(`EXTRACT(HOUR FROM a.timestamp) BETWEEN 7 AND 9`);
      } else if (window.peakPeriod === "evening") {
        conditions.push(`EXTRACT(HOUR FROM a.timestamp) BETWEEN 17 AND 19`);
      } else if (window.peakPeriod === "off-peak") {
        conditions.push(`EXTRACT(HOUR FROM a.timestamp) NOT BETWEEN 7 AND 9`);
        conditions.push(`EXTRACT(HOUR FROM a.timestamp) NOT BETWEEN 17 AND 19`);
      }
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      a.id,
      a.trip_id as "tripId",
      a.route_id as "routeId",
      a.station_id as "stationId",
      s.name as "stationName",
      a.scheduled_time as "scheduledTime",
      a.actual_time as "actualTime",
      a.delay_seconds as "delaySeconds",
      a.load_factor as "loadFactor",
      a.passenger_count as "passengerCount",
      a.crowding_level as "crowdingLevel",
      a.is_detour as "isDetour",
      a.timestamp
    FROM arrival_records a
    LEFT JOIN stations s ON a.station_id = s.id
    ${whereClause}
    ORDER BY a.timestamp DESC
  `;

  const result = await query(sql, params);
  return result.rows;
}

export async function getCardRecords_PostGIS(
  routeId?: string,
  stationId?: string,
  tripId?: string,
  window?: TimeWindow
): Promise<CardRecord[]> {
  if (!pool) return [];

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (routeId) {
    conditions.push(`c.route_id = $${paramIndex++}`);
    params.push(routeId);
  }
  if (stationId) {
    conditions.push(`c.station_id = $${paramIndex++}`);
    params.push(stationId);
  }
  if (tripId) {
    conditions.push(`c.trip_id = $${paramIndex++}`);
    params.push(tripId);
  }
  if (window) {
    if (window.startDate) {
      conditions.push(`c.timestamp >= $${paramIndex++}`);
      params.push(window.startDate);
    }
    if (window.endDate) {
      conditions.push(`c.timestamp <= $${paramIndex++}`);
      params.push(window.endDate + " 23:59:59");
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      c.id,
      c.card_id as "cardId",
      c.route_id as "routeId",
      c.station_id as "stationId",
      s.name as "stationName",
      c.trip_id as "tripId",
      c.tap_type as "tapType",
      c.timestamp,
      c.fare,
      c.passenger_type as "passengerType"
    FROM card_records c
    LEFT JOIN stations s ON c.station_id = s.id
    ${whereClause}
    ORDER BY c.timestamp DESC
    LIMIT 1000
  `;

  const result = await query(sql, params);
  return result.rows;
}

export async function getComplaints_PostGIS(
  routeId?: string,
  status?: Complaint["status"],
  category?: Complaint["category"],
  window?: TimeWindow
): Promise<Complaint[]> {
  if (!pool) return [];

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (routeId) {
    conditions.push(`c.route_id = $${paramIndex++}`);
    params.push(routeId);
  }
  if (status) {
    conditions.push(`c.status = $${paramIndex++}`);
    params.push(status);
  }
  if (category) {
    conditions.push(`c.category = $${paramIndex++}`);
    params.push(category);
  }
  if (window) {
    if (window.startDate) {
      conditions.push(`c.timestamp >= $${paramIndex++}`);
      params.push(window.startDate);
    }
    if (window.endDate) {
      conditions.push(`c.timestamp <= $${paramIndex++}`);
      params.push(window.endDate + " 23:59:59");
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      c.id,
      c.route_id as "routeId",
      r.name as "routeName",
      c.station_id as "stationId",
      s.name as "stationName",
      c.trip_id as "tripId",
      c.category,
      c.description,
      c.timestamp,
      c.status,
      c.reporter_contact as "reporterContact",
      c.notes
    FROM complaints c
    LEFT JOIN routes r ON c.route_id = r.id
    LEFT JOIN stations s ON c.station_id = s.id
    ${whereClause}
    ORDER BY c.timestamp DESC
  `;

  const result = await query(sql, params);
  return result.rows;
}

export async function getStationCrowdingData_PostGIS(
  window?: TimeWindow,
  routeId?: string
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
  if (!pool) return [];

  const conditions: string[] = ["a.is_detour = FALSE"];
  const params: any[] = [];
  let paramIndex = 1;

  if (routeId) {
    conditions.push(`a.route_id = $${paramIndex++}`);
    params.push(routeId);
  }
  if (window) {
    if (window.startDate) {
      conditions.push(`a.timestamp >= $${paramIndex++}`);
      params.push(window.startDate);
    }
    if (window.endDate) {
      conditions.push(`a.timestamp <= $${paramIndex++}`);
      params.push(window.endDate + " 23:59:59");
    }
    if (window.startHour !== undefined) {
      conditions.push(`EXTRACT(HOUR FROM a.timestamp) >= $${paramIndex++}`);
      params.push(window.startHour);
    }
    if (window.endHour !== undefined) {
      conditions.push(`EXTRACT(HOUR FROM a.timestamp) <= $${paramIndex++}`);
      params.push(window.endHour);
    }
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const sql = `
    SELECT
      s.id as "stationId",
      s.name as "stationName",
      ST_X(s.geom) as lng,
      ST_Y(s.geom) as lat,
      AVG(a.load_factor) as "avgLoadFactor",
      CASE
        WHEN AVG(a.load_factor) >= 0.9 THEN 'extreme'
        WHEN AVG(a.load_factor) >= 0.7 THEN 'high'
        WHEN AVG(a.load_factor) >= 0.4 THEN 'medium'
        ELSE 'low'
      END as "crowdingLevel",
      SUM(a.passenger_count) as "totalPassengers",
      COUNT(a.id) as "arrivalCount"
    FROM arrival_records a
    JOIN stations s ON a.station_id = s.id
    ${whereClause}
    GROUP BY s.id, s.name, s.geom
    ORDER BY "avgLoadFactor" DESC
  `;

  const result = await query(sql, params);
  return result.rows.map((row) => ({
    ...row,
    avgLoadFactor: Number(row.avgLoadFactor),
    totalPassengers: Number(row.totalPassengers),
    arrivalCount: Number(row.arrivalCount),
  }));
}

export async function calculateComparisonMetrics_PostGIS(
  routeIds: string[],
  peakPeriod?: PeakPeriod,
  window?: TimeWindow
): Promise<ComparisonMetric[]> {
  if (!pool) return [];

  const conditions: string[] = ["t.is_detour = FALSE", "a.is_detour = FALSE"];
  const params: any[] = [...routeIds];
  let paramIndex = routeIds.length + 1;

  if (peakPeriod) {
    conditions.push(`t.peak_period = $${paramIndex++}`);
    params.push(peakPeriod);
  }
  if (window) {
    if (window.startDate) {
      conditions.push(`a.timestamp >= $${paramIndex++}`);
      params.push(window.startDate);
    }
    if (window.endDate) {
      conditions.push(`a.timestamp <= $${paramIndex++}`);
      params.push(window.endDate + " 23:59:59");
    }
  }

  const whereClause = `WHERE r.id = ANY($1) AND ${conditions.join(" AND ")}`;

  const sql = `
    SELECT
      r.id as "routeId",
      r.name as "routeName",
      AVG(a.load_factor) as "avgLoadFactor",
      AVG(a.delay_seconds) as "avgDelaySeconds",
      SUM(CASE WHEN a.delay_seconds <= 120 THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as "onTimeRate",
      SUM(a.passenger_count) as "totalPassengers",
      MAX(a.load_factor) as "peakLoadFactor",
      (SELECT COUNT(*) FROM complaints c WHERE c.route_id = r.id) as "complaintCount"
    FROM routes r
    JOIN trips t ON r.id = t.route_id
    JOIN arrival_records a ON t.id = a.trip_id
    ${whereClause}
    GROUP BY r.id, r.name
  `;

  const result = await query(sql, params);
  return result.rows.map((row) => ({
    ...row,
    avgLoadFactor: Number(row.avgLoadFactor),
    avgDelaySeconds: Math.round(Number(row.avgDelaySeconds)),
    onTimeRate: Number(row.onTimeRate),
    totalPassengers: Number(row.totalPassengers),
    peakLoadFactor: Number(row.peakLoadFactor),
    complaintCount: Number(row.complaintCount),
  }));
}

export async function getTrips_PostGIS(
  routeId?: string,
  includeDetour: boolean = true,
  window?: TimeWindow
): Promise<Trip[]> {
  if (!pool) return [];

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (routeId) {
    conditions.push(`t.route_id = $${paramIndex++}`);
    params.push(routeId);
  }
  if (!includeDetour) {
    conditions.push(`t.is_detour = FALSE`);
  }
  if (window) {
    if (window.startDate) {
      conditions.push(`t.start_time >= $${paramIndex++}`);
      params.push(window.startDate);
    }
    if (window.endDate) {
      conditions.push(`t.start_time <= $${paramIndex++}`);
      params.push(window.endDate + " 23:59:59");
    }
    if (window.peakPeriod && window.peakPeriod !== "all") {
      conditions.push(`t.peak_period = $${paramIndex++}`);
      params.push(window.peakPeriod);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      t.id,
      t.route_id as "routeId",
      r.name as "routeName",
      t.direction,
      t.start_time as "startTime",
      t.end_time as "endTime",
      t.vehicle_id as "vehicleId",
      t.driver_name as "driverName",
      t.is_detour as "isDetour",
      t.detour_reason as "detourReason",
      t.peak_period as "peakPeriod"
    FROM trips t
    LEFT JOIN routes r ON t.route_id = r.id
    ${whereClause}
    ORDER BY t.start_time DESC
  `;

  const result = await query(sql, params);
  return result.rows;
}

export async function getWeatherRecords_PostGIS(
  date?: string,
  startHour?: number,
  endHour?: number
): Promise<WeatherRecord[]> {
  if (!pool) return [];

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (date) {
    conditions.push(`w.date = $${paramIndex++}`);
    params.push(date);
  }
  if (startHour !== undefined) {
    conditions.push(`w.hour >= $${paramIndex++}`);
    params.push(startHour);
  }
  if (endHour !== undefined) {
    conditions.push(`w.hour <= $${paramIndex++}`);
    params.push(endHour);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      w.id,
      w.timestamp,
      w.date,
      w.hour,
      w.condition,
      w.temperature,
      w.precipitation,
      w.wind_speed as "windSpeed",
      w.visibility
    FROM weather_records w
    ${whereClause}
    ORDER BY w.hour
  `;

  const result = await query(sql, params);
  return result.rows;
}

export async function getAnomalies_PostGIS(
  routeId?: string,
  type?: Anomaly["type"],
  resolved?: boolean,
  window?: TimeWindow
): Promise<Anomaly[]> {
  if (!pool) return [];

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (routeId) {
    conditions.push(`a.route_id = $${paramIndex++}`);
    params.push(routeId);
  }
  if (type) {
    conditions.push(`a.type = $${paramIndex++}`);
    params.push(type);
  }
  if (resolved !== undefined) {
    conditions.push(`a.resolved = $${paramIndex++}`);
    params.push(resolved);
  }
  if (window) {
    if (window.startDate) {
      conditions.push(`a.timestamp >= $${paramIndex++}`);
      params.push(window.startDate);
    }
    if (window.endDate) {
      conditions.push(`a.timestamp <= $${paramIndex++}`);
      params.push(window.endDate + " 23:59:59");
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      a.id,
      a.type,
      a.route_id as "routeId",
      a.station_id as "stationId",
      a.trip_id as "tripId",
      a.timestamp,
      a.severity,
      a.description,
      a.notes,
      a.resolved,
      a.resolved_by as "resolvedBy",
      a.resolved_at as "resolvedAt"
    FROM anomalies a
    ${whereClause}
    ORDER BY a.timestamp DESC
  `;

  const result = await query(sql, params);
  return result.rows;
}

export async function updateAnomalyNote_PostGIS(
  anomalyId: string,
  notes: string,
  resolvedBy: string
): Promise<Anomaly | null> {
  if (!pool) return null;

  const sql = `
    UPDATE anomalies
    SET
      notes = $1,
      resolved = TRUE,
      resolved_by = $2,
      resolved_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING
      id,
      type,
      route_id as "routeId",
      station_id as "stationId",
      trip_id as "tripId",
      timestamp,
      severity,
      description,
      notes,
      resolved,
      resolved_by as "resolvedBy",
      resolved_at as "resolvedAt"
  `;

  const result = await query(sql, [notes, resolvedBy, anomalyId]);
  return result.rows[0] || null;
}

export async function getDetourInfos_PostGIS(
  routeId?: string,
  window?: TimeWindow
): Promise<DetourInfo[]> {
  if (!pool) return [];

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (routeId) {
    conditions.push(`d.route_id = $${paramIndex++}`);
    params.push(routeId);
  }
  if (window) {
    if (window.startDate) {
      conditions.push(`d.start_time >= $${paramIndex++}`);
      params.push(window.startDate);
    }
    if (window.endDate) {
      conditions.push(`d.start_time <= $${paramIndex++}`);
      params.push(window.endDate + " 23:59:59");
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      d.id,
      d.trip_id as "tripId",
      d.route_id as "routeId",
      d.original_route as "originalRoute",
      d.detour_route as "detourRoute",
      d.reason,
      d.start_time as "startTime",
      d.end_time as "endTime",
      d.affected_stations as "affectedStations"
    FROM detour_records d
    ${whereClause}
    ORDER BY d.start_time DESC
  `;

  const result = await query(sql, params);
  return result.rows;
}

export function isPostGISEnabled(): boolean {
  return USE_POSTGIS && pool !== null;
}

export async function testPostGISConnection(): Promise<{
  connected: boolean;
  version?: string;
  postgisVersion?: string;
  error?: string;
}> {
  if (!pool) {
    return { connected: false, error: "PostGIS 未启用" };
  }

  try {
    const result = await query(`
      SELECT
        version(),
        PostGIS_Version() as postgis_version
    `);
    return {
      connected: true,
      version: result.rows[0].version,
      postgisVersion: result.rows[0].postgis_version,
    };
  } catch (error: any) {
    return {
      connected: false,
      error: error.message,
    };
  }
}
