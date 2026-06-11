import { createClient } from "@/utils/supabase/server";
import type { TrackingPoint } from "@/types";

function dbTrackingPointToTrackingPoint(dbPoint: any): TrackingPoint {
  return {
    id: dbPoint.id,
    orderId: dbPoint.order_id,
    riderId: dbPoint.rider_id,
    lat: dbPoint.location?.coordinates?.[1] || 0,
    lng: dbPoint.location?.coordinates?.[0] || 0,
    speed: dbPoint.speed,
    timestamp: new Date(dbPoint.timestamp),
  };
}

export async function getTrackingPointsByOrder(orderId: string): Promise<TrackingPoint[]> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from("tracking_points")
    .select("*")
    .eq("order_id", orderId)
    .order("timestamp", { ascending: true });

  if (error) {
    console.error("Error fetching tracking points:", error);
    return [];
  }

  return data?.map(dbTrackingPointToTrackingPoint) || [];
}

export async function getTrackingPointsByRider(
  riderId: string,
  limit: number = 100
): Promise<TrackingPoint[]> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from("tracking_points")
    .select("*")
    .eq("rider_id", riderId)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching tracking points by rider:", error);
    return [];
  }

  return data?.map(dbTrackingPointToTrackingPoint) || [];
}

export async function createTrackingPoint(
  orderId: string,
  riderId: string,
  lat: number,
  lng: number,
  speed: number
): Promise<boolean> {
  const supabase = createClient() as any;
  const { error } = await supabase.from("tracking_points").insert({
    order_id: orderId,
    rider_id: riderId,
    location: `POINT(${lng} ${lat})`,
    speed,
  });

  if (error) {
    console.error("Error creating tracking point:", error);
    return false;
  }

  return true;
}

export async function getDeliveryRoutesByRider(riderId: string): Promise<any[]> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from("delivery_routes")
    .select("*")
    .eq("rider_id", riderId)
    .order("start_time", { ascending: false });

  if (error) {
    console.error("Error fetching delivery routes:", error);
    return [];
  }

  return data || [];
}
