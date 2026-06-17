import { NextResponse } from "next/server";
import { deliveryService } from "@/services/deliveryService";

export async function GET() {
  try {
    const data = await deliveryService.getProjects();
    return NextResponse.json({
      success: true,
      data,
      message: "获取项目列表成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "获取项目列表失败",
      },
      { status: 500 }
    );
  }
}
