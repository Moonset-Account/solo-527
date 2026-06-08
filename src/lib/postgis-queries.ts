import { query, isPostGISAvailable } from './db';
import { workshops as mockWorkshops, getWorkshopById } from './mock-data';
import { Workshop, CrossShopTransfer, MaterialShortage } from './types';

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(2);
}

function computeWaitTime(distanceKm: number, fromLoad: number, fromCapacity: number): number {
  const loadRatio = fromLoad / fromCapacity;
  const loadDelay = loadRatio > 0.85 ? (loadRatio - 0.85) * 40 : 0;
  return +(1.5 + distanceKm / 8 + loadDelay * 0.08).toFixed(1);
}

export type DataSource = 'postgis' | 'fallback';

export interface TransferRouteResult {
  from_workshop_id: string;
  to_workshop_id: string;
  from_name: string;
  to_name: string;
  distance_km: number;
  wait_time_hours: number;
  route_geom: GeoJSON.LineString | null;
  source: DataSource;
}

export interface WorkshopGeoJSON {
  type: 'FeatureCollection';
  features: GeoJSON.Feature[];
  source: DataSource;
}

export interface WorkshopResult extends Workshop {
  source: DataSource;
}

export interface MaterialShortageResult extends MaterialShortage {
  source: DataSource;
}

export async function queryWorkshops(): Promise<WorkshopResult[]> {
  if (!isPostGISAvailable()) {
    return mockWorkshops.map((w) => ({ ...w, source: 'fallback' as const }));
  }
  const result = await query(
    'SELECT id, name, ST_X(geom) as lng, ST_Y(geom) as lat, capacity, current_load FROM workshops ORDER BY id'
  );
  return result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    lng: +r.lng,
    lat: +r.lat,
    capacity: r.capacity,
    currentLoad: r.current_load,
    source: 'postgis' as const,
  }));
}

export async function queryWorkshopsGeoJSON(): Promise<WorkshopGeoJSON> {
  if (!isPostGISAvailable()) {
    return {
      type: 'FeatureCollection',
      source: 'fallback',
      features: mockWorkshops.map((ws) => ({
        type: 'Feature' as const,
        id: ws.id,
        properties: { name: ws.name, capacity: ws.capacity, current_load: ws.currentLoad },
        geometry: { type: 'Point' as const, coordinates: [ws.lng, ws.lat] as [number, number] },
      })),
    };
  }
  const result = await query(
    `SELECT id, name, capacity, current_load,
       ST_AsGeoJSON(geom)::json as geom_json
     FROM workshops ORDER BY id`
  );
  return {
    type: 'FeatureCollection',
    source: 'postgis',
    features: result.rows.map((r) => ({
      type: 'Feature' as const,
      id: r.id,
      properties: { name: r.name, capacity: r.capacity, current_load: r.current_load },
      geometry: r.geom_json,
    })),
  };
}

export async function queryTransferDistance(fromId: string, toId: string): Promise<TransferRouteResult | null> {
  if (!isPostGISAvailable()) {
    const from = getWorkshopById(fromId);
    const to = getWorkshopById(toId);
    if (!from || !to || fromId === toId) return null;
    const distanceKm = haversineDistance(from.lat, from.lng, to.lat, to.lng);
    const waitTimeHours = computeWaitTime(distanceKm, from.currentLoad, from.capacity);
    return {
      from_workshop_id: fromId,
      to_workshop_id: toId,
      from_name: from.name,
      to_name: to.name,
      distance_km: distanceKm,
      wait_time_hours: waitTimeHours,
      route_geom: null,
      source: 'fallback',
    };
  }

  const result = await query(
    `SELECT wd.distance_km, wd.wait_time_hours,
       ST_AsGeoJSON(wd.route_geom)::json as route_geom,
       wf.name as from_name, wt.name as to_name
     FROM workshop_distances wd
     JOIN workshops wf ON wf.id = wd.from_workshop_id
     JOIN workshops wt ON wt.id = wd.to_workshop_id
     WHERE wd.from_workshop_id = $1 AND wd.to_workshop_id = $2`,
    [fromId, toId]
  );

  if (result.rows.length === 0) return null;
  const row = result.rows[0];

  return {
    from_workshop_id: fromId,
    to_workshop_id: toId,
    from_name: row.from_name,
    to_name: row.to_name,
    distance_km: +row.distance_km,
    wait_time_hours: +row.wait_time_hours,
    route_geom: row.route_geom,
    source: 'postgis',
  };
}

export async function queryTransferRoutes(transfers: CrossShopTransfer[]): Promise<TransferRouteResult[]> {
  const results: TransferRouteResult[] = [];
  for (const t of transfers) {
    const route = await queryTransferDistance(t.fromWorkshopId, t.toWorkshopId);
    if (route) results.push(route);
  }
  return results;
}

export async function queryTransfersGeoJSON(transfers: CrossShopTransfer[]): Promise<GeoJSON.FeatureCollection> {
  if (!isPostGISAvailable()) {
    const features = transfers.map((t) => {
      const from = getWorkshopById(t.fromWorkshopId);
      const to = getWorkshopById(t.toWorkshopId);
      if (!from || !to) return null;
      const distanceKm = haversineDistance(from.lat, from.lng, to.lat, to.lng);
      const waitTimeHours = computeWaitTime(distanceKm, from.currentLoad, from.capacity);
      const midLng = (from.lng + to.lng) / 2 + (Math.random() - 0.5) * 0.003;
      const midLat = (from.lat + to.lat) / 2 + (Math.random() - 0.5) * 0.002;
      return {
        type: 'Feature' as const,
        properties: { from_workshop_id: t.fromWorkshopId, to_workshop_id: t.toWorkshopId, distance_km: distanceKm, wait_time_hours: waitTimeHours, source: 'fallback' },
        geometry: { type: 'LineString' as const, coordinates: [[from.lng, from.lat], [midLng, midLat], [to.lng, to.lat]] as [number, number][] },
      };
    }).filter(Boolean) as GeoJSON.Feature[];

    return { type: 'FeatureCollection', features };
  }

  const features: GeoJSON.Feature[] = [];
  for (const t of transfers) {
    const result = await query(
      `SELECT wd.distance_km, wd.wait_time_hours,
         ST_AsGeoJSON(wd.route_geom)::json as route_geom
       FROM workshop_distances wd
       WHERE wd.from_workshop_id = $1 AND wd.to_workshop_id = $2`,
      [t.fromWorkshopId, t.toWorkshopId]
    );
    if (result.rows.length === 0) continue;
    const row = result.rows[0];
    features.push({
      type: 'Feature',
      properties: { from_workshop_id: t.fromWorkshopId, to_workshop_id: t.toWorkshopId, distance_km: +row.distance_km, wait_time_hours: +row.wait_time_hours, source: 'postgis' },
      geometry: row.route_geom,
    });
  }
  return { type: 'FeatureCollection', features };
}

export async function queryMaterialShortages(workOrderId: string): Promise<MaterialShortageResult[]> {
  if (!isPostGISAvailable()) {
    const shortageMap: Record<string, MaterialShortage[]> = {
      'WO-20260601': [
        { materialCode: 'M-1001', materialName: '高强度钢板', shortQty: 200, eta: '2026-06-12', severity: 'critical' },
        { materialCode: 'M-1002', materialName: '铝合金型材', shortQty: 50, eta: '2026-06-10', severity: 'warning' },
      ],
      'WO-20260603': [
        { materialCode: 'M-2001', materialName: '电子控制单元', shortQty: 15, eta: '2026-06-15', severity: 'critical' },
        { materialCode: 'M-2002', materialName: '液压管路', shortQty: 80, eta: '2026-06-11', severity: 'warning' },
      ],
      'WO-20260605': [
        { materialCode: 'M-1003', materialName: '密封胶条', shortQty: 300, eta: '2026-06-09', severity: 'normal' },
      ],
      'WO-20260608': [
        { materialCode: 'M-1001', materialName: '高强度钢板', shortQty: 120, eta: '2026-06-14', severity: 'critical' },
      ],
      'WO-20260611': [
        { materialCode: 'M-2001', materialName: '电子控制单元', shortQty: 25, eta: '2026-06-16', severity: 'critical' },
      ],
    };
    const shortages = shortageMap[workOrderId] || [];
    return shortages.map((s) => ({ ...s, source: 'fallback' as const }));
  }
  const result = await query(
    `SELECT material_code, material_name, short_qty, eta::TEXT, severity
     FROM material_shortages WHERE work_order_id = $1 ORDER BY severity, eta`,
    [workOrderId]
  );
  return result.rows.map((r) => ({
    materialCode: r.material_code,
    materialName: r.material_name,
    shortQty: r.short_qty,
    eta: r.eta,
    severity: r.severity,
    source: 'postgis' as const,
  }));
}

export async function queryRushOrders(workOrderId: string): Promise<Array<Record<string, unknown> & { source: DataSource }>> {
  if (!isPostGISAvailable()) {
    const wo = (await import('./mock-data')).workOrders.find((w) => w.id === workOrderId);
    if (!wo || wo.rushOrders.length === 0) return [];
    return wo.rushOrders.map((ro) => ({
      id: ro.id,
      work_order_id: ro.workOrderId,
      inserted_at: ro.insertedAt,
      approved_by: ro.approvedBy,
      approval_note: ro.approvalNote,
      impact_scope: ro.impactScope,
      priority_boost: ro.priorityBoost,
      original_delivery_date: ro.originalDeliveryDate,
      new_delivery_date: ro.newDeliveryDate,
      source: 'fallback' as const,
    }));
  }
  const result = await query(
    `SELECT id, work_order_id, inserted_at, approved_by, approval_note,
       impact_scope, priority_boost, original_delivery_date::TEXT, new_delivery_date::TEXT
     FROM rush_orders WHERE work_order_id = $1`,
    [workOrderId]
  );
  return result.rows.map((r) => ({ ...r, source: 'postgis' as const }));
}

export async function queryAdjustments(workOrderId: string): Promise<Array<Record<string, unknown> & { source: DataSource }>> {
  if (!isPostGISAvailable()) {
    const wo = (await import('./mock-data')).workOrders.find((w) => w.id === workOrderId);
    if (!wo || wo.priorityAdjustments.length === 0) return [];
    return wo.priorityAdjustments.map((adj) => ({
      id: adj.id,
      work_order_id: adj.workOrderId,
      adjusted_at: adj.adjustedAt,
      adjusted_by: adj.adjustedBy,
      old_priority: adj.oldPriority,
      new_priority: adj.newPriority,
      reason: adj.reason,
      affected_downstream_steps: adj.affectedDownstreamSteps,
      before_delay_risk: adj.beforeDelayRisk,
      after_delay_risk: adj.afterDelayRisk,
      source: 'fallback' as const,
    }));
  }
  const result = await query(
    `SELECT id, work_order_id, adjusted_at, adjusted_by, old_priority, new_priority,
       reason, affected_downstream_steps, before_delay_risk, after_delay_risk
     FROM priority_adjustments WHERE work_order_id = $1 ORDER BY adjusted_at`,
    [workOrderId]
  );
  return result.rows.map((r) => ({ ...r, source: 'postgis' as const }));
}

export async function queryTransfersForOrder(workOrderId: string): Promise<Array<{ from_workshop_id: string; to_workshop_id: string; distance_km: number; wait_time_hours: number } & { source: DataSource }>> {
  if (!isPostGISAvailable()) {
    const wo = (await import('./mock-data')).workOrders.find((w) => w.id === workOrderId);
    if (!wo || wo.crossShopTransfers.length === 0) return [];
    const results = [];
    for (const t of wo.crossShopTransfers) {
      const from = getWorkshopById(t.fromWorkshopId);
      const to = getWorkshopById(t.toWorkshopId);
      if (!from || !to) continue;
      const distanceKm = haversineDistance(from.lat, from.lng, to.lat, to.lng);
      const waitTimeHours = computeWaitTime(distanceKm, from.currentLoad, from.capacity);
      results.push({ from_workshop_id: t.fromWorkshopId, to_workshop_id: t.toWorkshopId, distance_km: distanceKm, wait_time_hours: waitTimeHours, source: 'fallback' as const });
    }
    return results;
  }
  const result = await query(
    `SELECT ct.from_workshop_id, ct.to_workshop_id,
       COALESCE(ct.distance_km, wd.distance_km) as distance_km,
       COALESCE(ct.wait_time_hours, wd.wait_time_hours) as wait_time_hours
     FROM cross_shop_transfers ct
     LEFT JOIN workshop_distances wd ON wd.from_workshop_id = ct.from_workshop_id AND wd.to_workshop_id = ct.to_workshop_id
     WHERE ct.work_order_id = $1`,
    [workOrderId]
  );
  return result.rows.map((r) => ({
    from_workshop_id: r.from_workshop_id,
    to_workshop_id: r.to_workshop_id,
    distance_km: +r.distance_km,
    wait_time_hours: +r.wait_time_hours,
    source: 'postgis' as const,
  }));
}
