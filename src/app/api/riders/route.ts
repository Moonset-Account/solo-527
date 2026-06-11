import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getRiders, updateRiderStatus } from "@/services/ridersService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined;
    const pageSize = searchParams.get("pageSize")
      ? parseInt(searchParams.get("pageSize")!)
      : undefined;

    const result = await getRiders({
      status: status as any,
      page,
      pageSize,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (error) {
    console.error("Error in GET /api/riders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch riders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, riderId, status } = body;

    if (action === "updateStatus") {
      const success = await updateRiderStatus(riderId, status);
      return NextResponse.json({ success });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in POST /api/riders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process rider" },
      { status: 500 }
    );
  }
}
