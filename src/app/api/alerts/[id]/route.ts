import { NextResponse } from "next/server";
import { alertService } from "@/services/alertService";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, userId, remark } = body;

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

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: "action 字段不能为空",
        },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: "userId 字段不能为空",
        },
        { status: 400 }
      );
    }

    const data = await alertService.processAlert(id, action, userId, remark);

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "NOT_FOUND",
          message: "告警不存在",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "处理告警成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "处理告警失败",
      },
      { status: 500 }
    );
  }
}
