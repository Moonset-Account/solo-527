import { NextResponse } from "next/server";
import { definitionService } from "@/services/definitionService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const v1Str = searchParams.get("v1");
    const v2Str = searchParams.get("v2");

    if (!v1Str || !v2Str) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_PARAMETER",
          message: "v1 和 v2 参数不能为空",
        },
        { status: 400 }
      );
    }

    const v1 = parseInt(v1Str, 10);
    const v2 = parseInt(v2Str, 10);

    if (isNaN(v1) || isNaN(v2)) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_PARAMETER",
          message: "v1 和 v2 必须是数字",
        },
        { status: 400 }
      );
    }

    const data = await definitionService.compareVersions(id, v1, v2);

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "NOT_FOUND",
          message: "口径不存在",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "版本对比成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "版本对比失败",
      },
      { status: 500 }
    );
  }
}
