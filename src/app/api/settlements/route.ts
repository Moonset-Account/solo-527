import { NextRequest, NextResponse } from "next/server";
import {
  UserRole,
  ReservationStatus,
  SettlementStatus,
} from "@/lib/types";
import prisma from "@/lib/prisma";
import { authenticateRequest, requireRole } from "@/lib/auth";
import { validate, settlementSchema } from "@/lib/validation";
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
    const userId = searchParams.get("userId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (userId) where.userId = parseInt(userId, 10);

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where,
        skip,
        take,
        include: {
          reservation: {
            include: {
              field: true,
              machinery: true,
              user: { select: { id: true, realName: true } },
            },
          },
          user: { select: { id: true, realName: true } },
          contract: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.settlement.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: settlements,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Get settlements error:", error);
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
    const { searchParams } = new URL(req.url);
    const reservationId = parseInt(searchParams.get("reservationId") || "0", 10);

    if (!reservationId) {
      return NextResponse.json(
        { success: false, error: "请指定作业预约ID" },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { dispatch: true },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: "作业预约不存在" },
        { status: 404 }
      );
    }

    if (
      reservation.status !== ReservationStatus.DISPATCHED &&
      reservation.status !== ReservationStatus.IN_PROGRESS
    ) {
      return NextResponse.json(
        { success: false, error: "只能对已派发或作业中的预约进行结算" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validation = validate(settlementSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const data = validation.data!;
    const totalAmount = data.actualArea * reservation.pricePerMu;
    const fuelCost = data.fuelCost ?? 0;
    const maintenanceCost = data.maintenanceCost ?? 0;
    const otherCost = data.otherCost ?? 0;
    const netIncome = totalAmount - fuelCost - maintenanceCost - otherCost;

    const settlement = await prisma.$transaction(async (tx) => {
      const newSettlement = await tx.settlement.create({
        data: {
          settlementNo: generateNo("SET"),
          reservationId,
          userId: reservation.userId,
          contractId: reservation.contractId,
          actualArea: data.actualArea,
          pricePerMu: reservation.pricePerMu,
          totalAmount,
          fuelCost,
          maintenanceCost,
          otherCost,
          netIncome,
          status: SettlementStatus.PENDING,
          remarks: data.remarks,
        },
        include: {
          reservation: {
            include: {
              field: true,
              machinery: true,
              user: { select: { id: true, realName: true } },
            },
          },
          user: { select: { id: true, realName: true } },
        },
      });

      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.COMPLETED },
      });

      if (reservation.machineryId) {
        await tx.machinery.update({
          where: { id: reservation.machineryId },
          data: { status: "IDLE" as any },
        });
      }

      if (reservation.dispatch?.id) {
        await tx.dispatch.update({
          where: { id: reservation.dispatch.id },
          data: { status: "COMPLETED" as any, completeTime: new Date() },
        });
      }

      return newSettlement;
    });

    return NextResponse.json(
      {
        success: true,
        data: settlement,
        message: "收益结算创建成功",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create settlement error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
