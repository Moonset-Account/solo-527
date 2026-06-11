import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getOrders, acceptOrder, assignRider } from "@/services/ordersService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const startTime = searchParams.get("startTime")
      ? new Date(searchParams.get("startTime")!)
      : undefined;
    const endTime = searchParams.get("endTime")
      ? new Date(searchParams.get("endTime")!)
      : undefined;
    const assignee = searchParams.get("assignee") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined;
    const pageSize = searchParams.get("pageSize")
      ? parseInt(searchParams.get("pageSize")!)
      : undefined;

    const result = await getOrders({
      status,
      startTime,
      endTime,
      assignee,
      page,
      pageSize,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (error) {
    console.error("Error in GET /api/orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, orderId, riderId, riderName, status } = body;

    if (action === "accept") {
      const success = await acceptOrder(orderId);
      return NextResponse.json({ success });
    }

    if (action === "assign") {
      const success = await assignRider(orderId, riderId, riderName);
      return NextResponse.json({ success });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in POST /api/orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process order" },
      { status: 500 }
    );
  }
}
