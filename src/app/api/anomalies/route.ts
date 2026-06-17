import { NextResponse } from "next/server";
import { anomalyService } from "@/services/anomalyService";
import type { AnomalyStatus, AnomalySeverity } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as AnomalyStatus | undefined;
    const severity = searchParams.get("severity") as AnomalySeverity | undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    if (isNaN(page) || page <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_PARAMETER",
          message: "page 参数必须是正整数",
        },
        { status: 400 }
      );
    }

    if (isNaN(pageSize) || pageSize <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_PARAMETER",
          message: "pageSize 参数必须是正整数",
        },
        { status: 400 }
      );
    }

    const data = await anomalyService.getAnomalies(status, severity, page, pageSize);
    return NextResponse.json({
      success: true,
      data,
      message: "获取异常列表成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "获取异常列表失败",
      },
      { status: 500 }
    );
  }
}
