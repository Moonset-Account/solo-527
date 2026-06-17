import { NextResponse } from "next/server";
import { anomalyService } from "@/services/anomalyService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { remark } = body;

    if (!remark || typeof remark !== "string" || remark.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: "remark 字段不能为空",
        },
        { status: 400 }
      );
    }

    const data = await anomalyService.detectAnomalies();
    return NextResponse.json({
      success: true,
      data,
      message: "触发异常检测成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "触发异常检测失败",
      },
      { status: 500 }
    );
  }
}
