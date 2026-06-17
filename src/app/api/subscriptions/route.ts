import { NextResponse } from "next/server";
import { subscriptionService } from "@/services/subscriptionService";
import type { Subscription } from "@/types";

export async function GET() {
  try {
    const data = await subscriptionService.getSubscriptions();
    return NextResponse.json({
      success: true,
      data,
      message: "获取订阅列表成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "获取订阅列表失败",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { remark, ...subscriptionData } = body;

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

    const data = await subscriptionService.createSubscription(
      subscriptionData as Omit<Subscription, "id" | "createdBy" | "createdAt">,
      remark
    );

    return NextResponse.json({
      success: true,
      data,
      message: "创建订阅成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "创建订阅失败",
      },
      { status: 500 }
    );
  }
}
