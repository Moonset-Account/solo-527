import { NextRequest, NextResponse } from "next/server";
import { UserRole, MachineryStatus } from "@/lib/types";
import prisma from "@/lib/prisma";
import { authenticateRequest, requireRole } from "@/lib/auth";
import { validate, createFuelSchema } from "@/lib/validation";
import { parsePagination } from "@/lib/utils";

export async function GET(req: NextRequest) {
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
    const { skip, take, page, pageSize } = parsePagination(searchParams);

    const machineryId = searchParams.get("machineryId");
    const dispatchId = searchParams.get("dispatchId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};
    if (machineryId) where.machineryId = parseInt(machineryId, 10);
    if (dispatchId) where.dispatchId = parseInt(dispatchId, 10);
    if (startDate) where.fillDate = { ...(where.fillDate as object), gte: new Date(startDate) };
    if (endDate) where.fillDate = { ...(where.fillDate as object), lte: new Date(endDate) };

    const [records, total] = await Promise.all([
      prisma.fuelRecord.findMany({
        where,
        skip,
        take,
        include: {
          machinery: true,
          dispatch: { include: { driver: true } },
          user: { select: { id: true, realName: true } },
        },
        orderBy: { fillDate: "desc" },
      }),
      prisma.fuelRecord.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: records,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Get fuel records error:", error);
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
    const validation = validate(createFuelSchema, body);

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

    if (data.dispatchId) {
      const dispatch = await prisma.dispatch.findUnique({
        where: { id: data.dispatchId },
      });
      if (!dispatch) {
        return NextResponse.json(
          { success: false, error: "派发记录不存在" },
          { status: 404 }
        );
      }
      if (dispatch.machineryId !== data.machineryId) {
        return NextResponse.json(
          { success: false, error: "派发记录与农机不匹配" },
          { status: 400 }
        );
      }
    }

    const totalCost = data.fuelAmount * data.fuelPrice;
    const newFuel = Math.min(
      machinery.currentFuel + data.fuelAmount,
      machinery.fuelCapacity
    );

    const record = await prisma.$transaction(async (tx) => {
      const newRecord = await tx.fuelRecord.create({
        data: {
          dispatchId: data.dispatchId,
          machineryId: data.machineryId,
          userId: auth.user.userId,
          fuelAmount: data.fuelAmount,
          fuelPrice: data.fuelPrice,
          totalCost,
          fillDate: new Date(data.fillDate),
          odometer: data.odometer,
          remarks: data.remarks,
        },
        include: {
          machinery: true,
          user: { select: { id: true, realName: true } },
        },
      });

      await tx.machinery.update({
        where: { id: data.machineryId },
        data: { currentFuel: newFuel },
      });

      return newRecord;
    });

    return NextResponse.json(
      {
        success: true,
        data: record,
        message: "油料登记成功",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create fuel record error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
