import { createClient } from "@/utils/supabase/server";
import type { Order, OrderStatus } from "@/types";



export interface OrdersQueryParams {
  status?: string;
  riderId?: string;
  startTime?: Date;
  endTime?: Date;
  assignee?: string;
  page?: number;
  pageSize?: number;
}

export interface OrdersResult {
  data: Order[];
  total: number;
}

function dbOrderToOrder(dbOrder: any): Order {
  return {
    id: dbOrder.id,
    orderNo: dbOrder.order_no,
    status: dbOrder.status as OrderStatus,
    priority: dbOrder.priority,
    pickupAddress: dbOrder.pickup_address,
    deliveryAddress: dbOrder.delivery_address,
    pickupLat: dbOrder.pickup_location?.coordinates?.[1] || 0,
    pickupLng: dbOrder.pickup_location?.coordinates?.[0] || 0,
    deliveryLat: dbOrder.delivery_location?.coordinates?.[1] || 0,
    deliveryLng: dbOrder.delivery_location?.coordinates?.[0] || 0,
    estimatedDeliveryTime: new Date(dbOrder.estimated_delivery_time),
    actualDeliveryTime: dbOrder.actual_delivery_time
      ? new Date(dbOrder.actual_delivery_time)
      : undefined,
    riderId: dbOrder.rider_id,
    riderName: dbOrder.rider_name,
    goodsType: dbOrder.goods_type,
    recipient: dbOrder.recipient,
    recipientPhone: dbOrder.recipient_phone,
    signature:
      dbOrder.signature_name || dbOrder.signature_image_url
        ? {
            name: dbOrder.signature_name || "",
            phone: dbOrder.signature_phone,
            signedAt: dbOrder.signed_at ? new Date(dbOrder.signed_at) : undefined,
            signatureImageUrl: dbOrder.signature_image_url,
          }
        : undefined,
    temperatureRequired:
      dbOrder.temp_min !== null && dbOrder.temp_max !== null
        ? { min: dbOrder.temp_min, max: dbOrder.temp_max }
        : undefined,
    createdAt: new Date(dbOrder.created_at),
    updatedAt: new Date(dbOrder.updated_at),
  };
}

export async function getOrders(params: OrdersQueryParams = {}): Promise<OrdersResult> {
  const supabase = createClient() as any;
  let query = supabase.from("orders").select("*", { count: "exact" });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.riderId) {
    query = query.eq("rider_id", params.riderId);
  }

  if (params.startTime) {
    query = query.gte("created_at", params.startTime.toISOString());
  }

  if (params.endTime) {
    query = query.lte("created_at", params.endTime.toISOString());
  }

  if (params.assignee) {
    query = query.ilike("rider_name", `%${params.assignee}%`);
  }

  if (params.page && params.pageSize) {
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching orders:", error);
    return { data: [], total: 0 };
  }

  return {
    data: data?.map(dbOrderToOrder) || [],
    total: count || 0,
  };
}

export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = createClient() as any;
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();

  if (error) {
    console.error("Error fetching order:", error);
    return null;
  }

  return data ? dbOrderToOrder(data) : null;
}

export async function acceptOrder(orderId: string): Promise<boolean> {
  const supabase = createClient() as any;
  const { error } = await supabase
    .from("orders")
    .update({ status: "accepted" })
    .eq("id", orderId);

  if (error) {
    console.error("Error accepting order:", error);
    return false;
  }

  return true;
}

export async function assignRider(orderId: string, riderId: string, riderName: string): Promise<boolean> {
  const supabase = createClient() as any;

  const { error: orderError } = await supabase
    .from("orders")
    .update({ status: "assigned", rider_id: riderId, rider_name: riderName })
    .eq("id", orderId);

  if (orderError) {
    console.error("Error assigning rider to order:", orderError);
    return false;
  }

  const { error: riderError } = await supabase
    .from("riders")
    .update({ status: "busy", current_order_id: orderId })
    .eq("id", riderId);

  if (riderError) {
    console.error("Error updating rider status:", riderError);
    return false;
  }

  return true;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
  const supabase = createClient() as any;
  const updateData: any = { status };

  if (status === "completed") {
    updateData.actual_delivery_time = new Date().toISOString();
  }

  const { error } = await supabase.from("orders").update(updateData).eq("id", orderId);

  if (error) {
    console.error("Error updating order status:", error);
    return false;
  }

  return true;
}
