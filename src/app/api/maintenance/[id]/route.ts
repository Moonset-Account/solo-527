import { NextRequest, NextResponse } from "next/server";
import {
  UserRole,
  MaintenanceStatus,
  MachineryStatus,
} from "@/lib/types";
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

    const record = await prisma.maintenanceRecord.findUnique({
      where: { id },
      include: { machinery: true },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: "维修记录不存在" },
        { status: 404 }
      );
    }

    if (action === "complete") {
      if (
        record.status !== MaintenanceStatus.REPORTED &&
        record.status !== MaintenanceStatus.IN_PROGRESS
      ) {
        return NextResponse.json(
          { success: false, error: "只能处理进行中的维修记录" },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.maintenanceRecord.update({
          where: { id },
          data: {
            status: MaintenanceStatus.COMPLETED,
            completeDate: new Date(),
          },
        });

        await tx.machinery.update({
          where: { id: record.machineryId },
          data: { status: MachineryStatus.IDLE },
        });
      });

      return NextResponse.json({
        success: true,
        message: "维修已完成，农机恢复可用状态",
      });
    }

    if (action === "cancel") {
      if (record.status === MaintenanceStatus.COMPLETED) {
        return NextResponse.json(
          { success: false, error: "已完成的维修记录不能取消" },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.maintenanceRecord.update({
          where: { id },
          data: { status: MaintenanceStatus.CANCELLED },
        });

        await tx.machinery.update({
          where: { id: record.machineryId },
          data: { status: MachineryStatus.IDLE },
        });
      });

      return NextResponse.json({
        success: true,
        message: "维修记录已取消，农机恢复可用状态",
      });
    }

    return NextResponse.json(
      { success: false, error: "不支持的操作" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Update maintenance error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
