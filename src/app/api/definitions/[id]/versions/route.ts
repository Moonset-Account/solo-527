import { NextResponse } from "next/server";
import { definitionService } from "@/services/definitionService";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await definitionService.getDefinitionVersions(id);
    return NextResponse.json({
      success: true,
      data,
      message: "获取版本历史成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "获取版本历史失败",
      },
      { status: 500 }
    );
  }
}
