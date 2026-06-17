import { NextResponse } from "next/server";
import { metricService } from "@/services/metricService";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await metricService.getMetricById(id);
    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "NOT_FOUND",
          message: "指标不存在",
        },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data,
      message: "获取指标详情成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "获取指标详情失败",
      },
      { status: 500 }
    );
  }
}
