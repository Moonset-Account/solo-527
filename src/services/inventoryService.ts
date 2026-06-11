import { createClient } from "@/utils/supabase/server";
import type { InventoryItem } from "@/types";

export interface InventoryQueryParams {
  siteId?: string;
  siteName?: string;
  sku?: string;
  productName?: string;
  lowStock?: boolean;
  page?: number;
  pageSize?: number;
}

export interface InventoryResult {
  data: InventoryItem[];
  total: number;
}

function dbInventoryToInventory(dbItem: any): InventoryItem {
  return {
    id: dbItem.id,
    siteId: dbItem.site_id,
    siteName: dbItem.site_name,
    sku: dbItem.sku,
    productName: dbItem.product_name,
    quantity: dbItem.quantity,
    reservedQuantity: dbItem.reserved_quantity,
    availableQuantity: dbItem.available_quantity,
    inTransitQuantity: dbItem.in_transit_quantity,
    inTransitFrom: dbItem.in_transit_from,
    inTransitEstimatedArrival: dbItem.in_transit_estimated_arrival
      ? new Date(dbItem.in_transit_estimated_arrival)
      : undefined,
    unitCost: dbItem.unit_cost,
    warningThreshold: dbItem.warning_threshold,
    lastUpdated: new Date(dbItem.last_updated),
  };
}

export async function getInventoryItems(
  params: InventoryQueryParams = {}
): Promise<InventoryResult> {
  const supabase = createClient() as any;
  let query = supabase
    .from("inventory_items")
    .select("*", { count: "exact" });

  if (params.siteId) {
    query = query.eq("site_id", params.siteId);
  }

  if (params.siteName) {
    query = query.ilike("site_name", `%${params.siteName}%`);
  }

  if (params.sku) {
    query = query.ilike("sku", `%${params.sku}%`);
  }

  if (params.productName) {
    query = query.ilike("product_name", `%${params.productName}%`);
  }

  if (params.lowStock) {
    query = query.lte("available_quantity", query.ref("warning_threshold"));
  }

  if (params.page && params.pageSize) {
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);
  }

  query = query.order("last_updated", { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching inventory items:", error);
    return { data: [], total: 0 };
  }

  return {
    data: data?.map(dbInventoryToInventory) || [],
    total: count || 0,
  };
}

export async function getInventoryItemById(id: string): Promise<InventoryItem | null> {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching inventory item:", error);
    return null;
  }

  return data ? dbInventoryToInventory(data) : null;
}

export async function updateInventoryQuantity(
  id: string,
  quantity: number,
  reservedQuantity: number
): Promise<boolean> {
  const supabase = createClient() as any;
  const availableQuantity = quantity - reservedQuantity;

  const { error } = await supabase
    .from("inventory_items")
    .update({
      quantity,
      reserved_quantity: reservedQuantity,
      available_quantity: availableQuantity,
      last_updated: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating inventory quantity:", error);
    return false;
  }

  return true;
}
