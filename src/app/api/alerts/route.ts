import { NextResponse } from "next/server";
import { alertService } from "@/services/alertService";

export async function GET() {
  try {
    const data = await alertService.getAlerts();
    return NextResponse.json({
      success: true,
      data,
      message: "获取告警列表成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "获取告警列表失败",
      },
      { status: 500 }
    );
  }
}
