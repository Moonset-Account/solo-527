import { NextResponse } from "next/server";
import { metricService } from "@/services/metricService";
import type { DimensionConfig } from "@/types";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { dimensions, remark } = body;

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

    if (!dimensions || !Array.isArray(dimensions)) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: "dimensions 字段必须是数组",
        },
        { status: 400 }
      );
    }

    const data = await metricService.updateDimensions(
      id,
      dimensions as DimensionConfig[],
      remark
    );

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
      message: "更新维度配置成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "更新维度配置失败",
      },
      { status: 500 }
    );
  }
}
