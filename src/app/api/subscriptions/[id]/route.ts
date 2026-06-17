import { NextResponse } from "next/server";
import { subscriptionService } from "@/services/subscriptionService";
import type { Subscription } from "@/types";

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

    const data = await subscriptionService.updateSubscription(
      id,
      updateData as Partial<Subscription>,
      remark
    );

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "NOT_FOUND",
          message: "订阅不存在",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "更新订阅成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "更新订阅失败",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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

    const success = await subscriptionService.deleteSubscription(id, remark);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "NOT_FOUND",
          message: "订阅不存在",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: null,
      message: "删除订阅成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "删除订阅失败",
      },
      { status: 500 }
    );
  }
}
