import { NextResponse } from "next/server";
import { definitionService } from "@/services/definitionService";
import type { MetricDefinition } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const metricId = searchParams.get("metricId") || undefined;

    const data = await definitionService.getDefinitions(metricId);
    return NextResponse.json({
      success: true,
      data,
      message: "获取口径列表成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "获取口径列表失败",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { remark, ...definitionData } = body;

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

    const data = await definitionService.createDefinitionVersion(
      definitionData as Omit<
        MetricDefinition,
        "id" | "version" | "createdBy" | "createdByName" | "createdAt" | "isCurrent"
      >,
      remark
    );

    return NextResponse.json({
      success: true,
      data,
      message: "创建口径新版本成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "创建口径新版本失败",
      },
      { status: 500 }
    );
  }
}
