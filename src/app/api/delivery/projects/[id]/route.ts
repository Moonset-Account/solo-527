import { NextResponse } from "next/server";
import { deliveryService } from "@/services/deliveryService";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { progress, remark } = body;

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

    if (progress === undefined || progress === null || isNaN(progress)) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: "progress 字段不能为空且必须是数字",
        },
        { status: 400 }
      );
    }

    if (progress < 0 || progress > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: "progress 必须在 0-100 之间",
        },
        { status: 400 }
      );
    }

    const data = await deliveryService.updateProjectProgress(id, progress, remark);

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "NOT_FOUND",
          message: "项目不存在",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "更新项目进度成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "更新项目进度失败",
      },
      { status: 500 }
    );
  }
}
