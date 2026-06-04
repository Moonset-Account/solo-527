import { NextRequest, NextResponse } from "next/server";
import { UserRole, SettlementStatus } from "@/lib/types";
import prisma from "@/lib/prisma";
import { authenticateRequest, requireRole } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateRequest(req);
  if (auth.error) {
    return NextResponse.json(
      { success: false, error: auth.error.message },
      { status: auth.error.status }
    );
  }

  const roleCheck = requireRole(auth.user, [UserRole.INTERNAL]);
  if (!roleCheck.allowed) {
    return NextResponse.json(
      { success: false, error: roleCheck.error },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const id = parseInt(params.id, 10);

    const settlement = await prisma.settlement.findUnique({
      where: { id },
    });

    if (!settlement) {
      return NextResponse.json(
        { success: false, error: "结算记录不存在" },
        { status: 404 }
      );
    }

    if (action === "pay") {
      if (settlement.status !== SettlementStatus.PENDING) {
        return NextResponse.json(
          { success: false, error: "只能对待结算状态的记录进行支付" },
          { status: 400 }
        );
      }

      await prisma.settlement.update({
        where: { id },
        data: {
          status: SettlementStatus.PAID,
          paidDate: new Date(),
          paidById: auth.user.userId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "结算已标记为已支付",
      });
    }

    if (action === "cancel") {
      if (settlement.status === SettlementStatus.PAID) {
        return NextResponse.json(
          { success: false, error: "已支付的结算记录不能取消" },
          { status: 400 }
        );
      }

      await prisma.settlement.update({
        where: { id },
        data: { status: SettlementStatus.CANCELLED },
      });

      return NextResponse.json({
        success: true,
        message: "结算记录已取消",
      });
    }

    return NextResponse.json(
      { success: false, error: "不支持的操作" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Update settlement error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
