import { NextResponse } from "next/server";
import { anomalyService } from "@/services/anomalyService";
import type { Anomaly } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await anomalyService.getAnomalyById(id);
    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "NOT_FOUND",
          message: "异常不存在",
        },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data,
      message: "获取异常详情成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "获取异常详情失败",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { remark, ...updateData } = body;

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

    const data = await anomalyService.updateAnomaly(
      id,
      updateData as Partial<Anomaly>,
      remark
    );

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "NOT_FOUND",
          message: "异常不存在",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "更新异常成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "更新异常失败",
      },
      { status: 500 }
    );
  }
}
