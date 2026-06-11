import { NextResponse } from "next/server";
import {
  getTemperatureRecordsByOrder,
  getLatestTemperatureByOrder,
  getAbnormalTemperatureOrders,
  createTemperatureRecord,
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, temperature, humidity, isNormal } = body;

    if (!orderId || temperature === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const success = await createTemperatureRecord(
      orderId,
      temperature,
      humidity,
      isNormal !== undefined ? isNormal : true
    );

    return NextResponse.json({ success });
  } catch (error) {
    console.error("Error in POST /api/temperature:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create temperature record" },
      { status: 500 }
    );
  }
}
