import { NextResponse } from "next/server";
import {
  getTemperatureRecordsByOrder,
  getLatestTemperatureByOrder,
  getAbnormalTemperatureOrders,
} from "@/services/temperatureService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const latest = searchParams.get("latest") === "true";
    const abnormal = searchParams.get("abnormal") === "true";

    if (abnormal) {
      const data = await getAbnormalTemperatureOrders();
      return NextResponse.json({ success: true, data });
    }

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Missing orderId parameter" },
        { status: 400 }
      );
    }

    if (latest) {
      const data = await getLatestTemperatureByOrder(orderId);
      return NextResponse.json({ success: true, data });
    }

    const data = await getTemperatureRecordsByOrder(orderId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in GET /api/temperature:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch temperature data" },
      { status: 500 }
    );
  }
}
