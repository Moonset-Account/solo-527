import { NextResponse } from "next/server";
import { metricService } from "@/services/metricService";

export async function GET() {
  try {
    const data = await metricService.getMetrics();
    return NextResponse.json({
      success: true,
      data,
      message: "获取指标列表成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "获取指标列表失败",
      },
      { status: 500 }
    );
  }
}
