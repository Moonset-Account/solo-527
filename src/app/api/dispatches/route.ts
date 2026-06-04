import { NextRequest, NextResponse } from "next/server";
import {
  UserRole,
  ReservationStatus,
  DispatchStatus,
  MachineryStatus,
} from "@/lib/types";
import prisma from "@/lib/prisma";
import { authenticateRequest, requireRole } from "@/lib/auth";
import { validate, createDispatchSchema } from "@/lib/validation";
import { generateNo, parsePagination } from "@/lib/utils";

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

    const status = searchParams.get("status");
    const machineryId = searchParams.get("machineryId");
    const driverId = searchParams.get("driverId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (machineryId) where.machineryId = parseInt(machineryId, 10);
    if (driverId) where.driverId = parseInt(driverId, 10);

    const [dispatches, total] = await Promise.all([
      prisma.dispatch.findMany({
        where,
        skip,
        take,
        include: {
          reservation: {
            include: {
              field: true,
              user: { select: { id: true, realName: true } },
            },
          },
          machinery: true,
          driver: true,
          createdBy: { select: { id: true, realName: true } },
          fuelRecords: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.dispatch.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: dispatches,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Get dispatches error:", error);
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
    const validation = validate(createDispatchSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const data = validation.data!;

    const reservation = await prisma.reservation.findUnique({
      where: { id: data.reservationId },
    });
    if (!reservation) {
      return NextResponse.json(
        { success: false, error: "作业预约不存在" },
        { status: 404 }
      );
    }

    if (
      reservation.status !== ReservationStatus.APPROVED) {
      return NextResponse.json(
        { success: false, error: "只能派发已审批状态的预约" },
        { status: 400 }
      );
    }

    const existingDispatch = await prisma.dispatch.findUnique({
      where: { reservationId: data.reservationId },
    });
    if (existingDispatch) {
      return NextResponse.json(
        { success: false, error: "该预约已派发过了" },
        { status: 409 }
      );
    }

    const machinery = await prisma.machinery.findUnique({
      where: { id: data.machineryId },
    });
    if (!machinery) {
      return NextResponse.json(
        { success: false, error: "农机不存在" },
        { status: 404 }
      );
    }

    if (machinery.status !== MachineryStatus.IDLE) {
      return NextResponse.json(
        { success: false, error: "该农机当前状态不可用" },
        { status: 400 }
      );
    }

    const driver = await prisma.driver.findUnique({
      where: { id: data.driverId },
    });
    if (!driver) {
      return NextResponse.json(
        { success: false, error: "司机不存在" },
        { status: 404 }
      );
    }

    const dispatch = await prisma.$transaction(async (tx) => {
      const newDispatch = await tx.dispatch.create({
        data: {
          dispatchNo: generateNo("DIS"),
          reservationId: data.reservationId,
          machineryId: data.machineryId,
          driverId: data.driverId,
          createdById: auth.user.userId,
          status: DispatchStatus.PENDING,
          route: data.route,
          remarks: data.remarks,
        },
        include: {
          reservation: { include: { field: true } },
          machinery: true,
          driver: true,
          createdBy: { select: { id: true, realName: true } },
        },
      });

      await tx.reservation.update({
        where: { id: data.reservationId },
        data: {
          status: ReservationStatus.DISPATCHED,
          machineryId: data.machineryId,
          handledById: auth.user.userId,
          handledAt: new Date(),
        },
      });

      await tx.machinery.update({
        where: { id: data.machineryId },
        data: { status: MachineryStatus.DISPATCHED },
      });

      return newDispatch;
    });

    return NextResponse.json(
      {
        success: true,
        data: dispatch,
        message: "路线派发成功",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create dispatch error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
