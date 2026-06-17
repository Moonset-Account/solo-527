import { NextResponse } from "next/server";
import { metricService } from "@/services/metricService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    if (isNaN(days) || days <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_PARAMETER",
          message: "days 参数必须是正整数",
        },
        { status: 400 }
      );
    }

    const data = await metricService.getMetricData(id, days);
    return NextResponse.json({
      success: true,
      data,
      message: "获取指标时序数据成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "获取指标时序数据失败",
      },
      { status: 500 }
    );
  }
}
