import { NextResponse } from "next/server";
import {
  getTrackingPointsByOrder,
  getTrackingPointsByRider,
  getDeliveryRoutesByRider,
} from "@/services/trackingService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const riderId = searchParams.get("riderId");
    const routes = searchParams.get("routes") === "true";

    if (routes && riderId) {
      const data = await getDeliveryRoutesByRider(riderId);
      return NextResponse.json({ success: true, data });
    }

    if (orderId) {
      const data = await getTrackingPointsByOrder(orderId);
      return NextResponse.json({ success: true, data });
    }

    if (riderId) {
      const data = await getTrackingPointsByRider(riderId);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json(
      { success: false, error: "Missing orderId or riderId parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in GET /api/tracking:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tracking data" },
      { status: 500 }
    );
  }
}
