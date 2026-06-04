import { NextRequest, NextResponse } from "next/server";
import {
  UserRole,
  MaintenanceStatus,
  MachineryStatus,
} from "@/lib/types";
import prisma from "@/lib/prisma";
import { authenticateRequest, requireRole } from "@/lib/auth";
import { validate, createMaintenanceSchema } from "@/lib/validation";
import { parsePagination } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) {
    return NextResponse.json(
      { success: false, error: auth.error.message },
      { status: auth.error.status }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const { skip, take, page, pageSize } = parsePagination(searchParams);

    const status = searchParams.get("status");
    const machineryId = searchParams.get("machineryId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (machineryId) where.machineryId = parseInt(machineryId, 10);

    const [records, total] = await Promise.all([
      prisma.maintenanceRecord.findMany({
        where,
        skip,
        take,
        include: {
          machinery: true,
          user: { select: { id: true, realName: true } },
        },
        orderBy: { reportedDate: "desc" },
      }),
      prisma.maintenanceRecord.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: records,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Get maintenance records error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    const body = await req.json();
    const validation = validate(createMaintenanceSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const data = validation.data!;

    const machinery = await prisma.machinery.findUnique({
      where: { id: data.machineryId },
    });
    if (!machinery) {
      return NextResponse.json(
        { success: false, error: "农机不存在" },
        { status: 404 }
      );
    }

    const record = await prisma.$transaction(async (tx) => {
      const newRecord = await tx.maintenanceRecord.create({
        data: {
          machineryId: data.machineryId,
          userId: auth.user.userId,
          title: data.title,
          description: data.description,
          status: MaintenanceStatus.REPORTED,
          reportedDate: new Date(data.reportedDate),
          cost: data.cost || 0,
          parts: data.parts,
          remarks: data.remarks,
        },
        include: {
          machinery: true,
          user: { select: { id: true, realName: true } },
        },
      });

      await tx.machinery.update({
        where: { id: data.machineryId },
        data: { status: MachineryStatus.MAINTENANCE },
      });

      return newRecord;
    });

    return NextResponse.json(
      {
        success: true,
        data: record,
        message: "维修记录上报成功，农机已暂停作业",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create maintenance record error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
