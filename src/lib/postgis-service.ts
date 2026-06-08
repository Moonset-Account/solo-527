import { CrossShopTransfer } from './types';
import { workshops as workshopData, getWorkshopById } from './mock-data';

export interface PostGISWorkshop {
  id: string;
  name: string;
  geom: { type: 'Point'; coordinates: [number, number] };
  capacity: number;
  current_load: number;
}

export interface PostGISTransferRoute {
  from_workshop_id: string;
  to_workshop_id: string;
  distance_km: number;
  wait_time_hours: number;
  route_geom: { type: 'LineString'; coordinates: [number, number][] } | null;
}

export interface PostGISDistanceResult {
  from_id: string;
  to_id: string;
  distance_km: number;
  wait_time_hours: number;
}

const TRANSFER_SPEED_KMH = 8;
const BASE_LOAD_TIME_H = 1.5;
const DISTANCE_FACTOR = 0.08;

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
  return +(BASE_LOAD_TIME_H + distanceKm / TRANSFER_SPEED_KMH + loadDelay * DISTANCE_FACTOR).toFixed(1);
}

export function postGISWorkshopsToGeoJSON(): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: workshopData.map((ws) => ({
      type: 'Feature' as const,
      id: ws.id,
      properties: {
        name: ws.name,
        capacity: ws.capacity,
        current_load: ws.currentLoad,
        load_ratio: +(ws.currentLoad / ws.capacity).toFixed(3),
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [ws.lng, ws.lat] as [number, number],
      },
    })),
  };
}

export function postGISQueryDistance(fromId: string, toId: string): PostGISDistanceResult | null {
  const from = getWorkshopById(fromId);
  const to = getWorkshopById(toId);
  if (!from || !to) return null;
  if (fromId === toId) return null;

  const distanceKm = haversineDistance(from.lat, from.lng, to.lat, to.lng);
  const waitTimeHours = computeWaitTime(distanceKm, from.currentLoad, from.capacity);

  return {
    from_id: fromId,
    to_id: toId,
    distance_km: distanceKm,
    wait_time_hours: waitTimeHours,
  };
}

export function postGISQueryAllDistances(): PostGISDistanceResult[] {
  const results: PostGISDistanceResult[] = [];
  for (let i = 0; i < workshopData.length; i++) {
    for (let j = 0; j < workshopData.length; j++) {
      if (i === j) continue;
      const r = postGISQueryDistance(workshopData[i].id, workshopData[j].id);
      if (r) results.push(r);
    }
  }
  return results;
}

export function postGISSimulateTransferRoute(transfer: CrossShopTransfer): PostGISTransferRoute {
  const from = getWorkshopById(transfer.fromWorkshopId);
  const to = getWorkshopById(transfer.toWorkshopId);

  if (!from || !to) {
    return {
      from_workshop_id: transfer.fromWorkshopId,
      to_workshop_id: transfer.toWorkshopId,
      distance_km: transfer.distanceKm,
      wait_time_hours: transfer.waitTimeHours,
      route_geom: null,
    };
  }

  const distResult = postGISQueryDistance(transfer.fromWorkshopId, transfer.toWorkshopId);
  const distanceKm = distResult?.distance_km ?? transfer.distanceKm;
  const waitTimeHours = distResult?.wait_time_hours ?? transfer.waitTimeHours;

  const midLng = (from.lng + to.lng) / 2 + (Math.random() - 0.5) * 0.003;
  const midLat = (from.lat + to.lat) / 2 + (Math.random() - 0.5) * 0.002;

  return {
    from_workshop_id: transfer.fromWorkshopId,
    to_workshop_id: transfer.toWorkshopId,
    distance_km: distanceKm,
    wait_time_hours: waitTimeHours,
    route_geom: {
      type: 'LineString',
      coordinates: [
        [from.lng, from.lat],
        [midLng, midLat],
        [to.lng, to.lat],
      ],
    },
  };
}

export function postGISTransfersToGeoJSON(transfers: CrossShopTransfer[]): GeoJSON.FeatureCollection {
  const features = transfers.map((t) => {
    const route = postGISSimulateTransferRoute(t);
    return {
      type: 'Feature' as const,
      properties: {
        from_workshop_id: route.from_workshop_id,
        to_workshop_id: route.to_workshop_id,
        distance_km: route.distance_km,
        wait_time_hours: route.wait_time_hours,
      },
      geometry: route.route_geom ?? {
        type: 'LineString' as const,
        coordinates: [] as [number, number][],
      },
    };
  });

  return { type: 'FeatureCollection', features };
}
