import { NextResponse } from "next/server";
import { deliveryService } from "@/services/deliveryService";

export async function GET() {
  try {
    const data = await deliveryService.getReports();
    return NextResponse.json({
      success: true,
      data,
      message: "获取复盘报表成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "获取复盘报表失败",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { month, remark } = body;

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

    if (!month || typeof month !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: "month 字段不能为空",
        },
        { status: 400 }
      );
    }

    const data = await deliveryService.generateReport(month, remark);

    return NextResponse.json({
      success: true,
      data,
      message: "生成复盘报表成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "生成复盘报表失败",
      },
      { status: 500 }
    );
  }
}
