import { NextResponse } from "next/server";
import { getOperationLogs, createOperationLog } from "@/services/logsService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") as any) || undefined;
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

    const result = await getOperationLogs({
      type,
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
    console.error("Error in GET /api/logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const success = await createOperationLog(body);

    return NextResponse.json({ success });
  } catch (error) {
    console.error("Error in POST /api/logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create log" },
      { status: 500 }
    );
  }
}
