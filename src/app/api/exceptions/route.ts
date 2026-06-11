import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  getExceptions,
  updateExceptionStatus,
  addProcessingNote,
} from "@/services/exceptionsService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const type = searchParams.get("type") || undefined;
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

    const result = await getExceptions({
      status,
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
    console.error("Error in GET /api/exceptions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exceptions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, exceptionId, status, content, author } = body;

    if (action === "updateStatus") {
      const success = await updateExceptionStatus(exceptionId, status);
      return NextResponse.json({ success });
    }

    if (action === "addNote") {
      const success = await addProcessingNote(exceptionId, content, author);
      return NextResponse.json({ success });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in POST /api/exceptions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process exception" },
      { status: 500 }
    );
  }
}
