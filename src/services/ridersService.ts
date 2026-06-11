import { createClient } from "@/utils/supabase/server";
import type { Rider, RiderStatus, RiderLocation } from "@/types";

export interface RidersQueryParams {
  status?: RiderStatus;
  page?: number;
  pageSize?: number;
}

export interface RidersResult {
  data: Rider[];
  total: number;
}

function dbRiderToRider(dbRider: any): Rider {
  return {
    id: dbRider.id,
    name: dbRider.name,
    phone: dbRider.phone,
    status: dbRider.status as RiderStatus,
    currentLat: dbRider.current_location?.coordinates?.[1],
    currentLng: dbRider.current_location?.coordinates?.[0],
    currentLocation: dbRider.current_location
      ? {
          lat: dbRider.current_location.coordinates[1],
          lng: dbRider.current_location.coordinates[0],
          speed: 0,
          timestamp: new Date(),
        }
      : undefined,
    currentOrderId: dbRider.current_order_id,
    batteryLevel: dbRider.battery_level,
    todayMileage: dbRider.today_mileage,
    todayWorkingHours: dbRider.today_working_hours,
    rating: dbRider.rating,
    totalDeliveries: dbRider.total_deliveries,
  };
}

export async function getRiders(params: RidersQueryParams = {}): Promise<RidersResult> {
  const supabase = createClient() as any;
  let query = supabase.from("riders").select("*", { count: "exact" });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.page && params.pageSize) {
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching riders:", error);
    return { data: [], total: 0 };
  }

  return {
    data: data?.map(dbRiderToRider) || [],
    total: count || 0,
  };
}

export async function getRiderById(id: string): Promise<Rider | null> {
  const supabase = createClient() as any;
  const { data, error } = await supabase.from("riders").select("*").eq("id", id).single();

  if (error) {
    console.error("Error fetching rider:", error);
    return null;
  }

  return data ? dbRiderToRider(data) : null;
}

export async function updateRiderLocation(
  riderId: string,
  location: RiderLocation
): Promise<boolean> {
  const supabase = createClient() as any;
  const { error } = await supabase
    .from("riders")
    .update({
      current_location: `POINT(${location.lng} ${location.lat})`,
    })
    .eq("id", riderId);

  if (error) {
    console.error("Error updating rider location:", error);
    return false;
  }

  return true;
}

export async function updateRiderStatus(riderId: string, status: RiderStatus): Promise<boolean> {
  const supabase = createClient() as any;
  const { error } = await supabase.from("riders").update({ status }).eq("id", riderId);

  if (error) {
    console.error("Error updating rider status:", error);
    return false;
  }

  return true;
}
