import { createClient } from "@/utils/supabase/server";
import type { TemperatureRecord } from "@/types";

function dbTempRecordToTempRecord(dbRecord: any): TemperatureRecord {
  return {
    id: dbRecord.id,
    orderId: dbRecord.order_id,
    temperature: dbRecord.temperature,
    humidity: dbRecord.humidity || 0,
    timestamp: new Date(dbRecord.timestamp),
    isNormal: dbRecord.is_normal,
  };
}

export async function getTemperatureRecordsByOrder(
  orderId: string,
  limit: number = 100
): Promise<TemperatureRecord[]> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from("temperature_records")
    .select("*")
    .eq("order_id", orderId)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching temperature records:", error);
    return [];
  }

  return data?.map(dbTempRecordToTempRecord).reverse() || [];
}

export async function getLatestTemperatureByOrder(
  orderId: string
): Promise<TemperatureRecord | null> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from("temperature_records")
    .select("*")
    .eq("order_id", orderId)
    .order("timestamp", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching latest temperature:", error);
    return null;
  }

  return data ? dbTempRecordToTempRecord(data) : null;
}

export async function createTemperatureRecord(
  orderId: string,
  temperature: number,
  humidity?: number,
  isNormal: boolean = true
): Promise<boolean> {
  const supabase = createClient() as any;
  const { error } = await supabase.from("temperature_records").insert({
    order_id: orderId,
    temperature,
    humidity,
    is_normal: isNormal,
  });

  if (error) {
    console.error("Error creating temperature record:", error);
    return false;
  }

  return true;
}

export async function getAbnormalTemperatureOrders(): Promise<TemperatureRecord[]> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from("temperature_records")
    .select("*, orders(order_no, rider_name)")
    .eq("is_normal", false)
    .order("timestamp", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching abnormal temperatures:", error);
    return [];
  }

  return data?.map(dbTempRecordToTempRecord) || [];
}
