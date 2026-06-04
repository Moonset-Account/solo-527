import { NextRequest, NextResponse } from "next/server";
import { UserRole, ReservationStatus } from "@/lib/types";
import prisma from "@/lib/prisma";
import { authenticateRequest, requireRole } from "@/lib/auth";
import { validate, batchRescheduleSchema } from "@/lib/validation";

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
    const validation = validate(batchRescheduleSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { date, village, newDate, reason } = validation.data!;

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const targetDateEnd = new Date(targetDate);
    targetDateEnd.setHours(23, 59, 59, 999);

    const newTargetDate = new Date(newDate);
    newTargetDate.setHours(0, 0, 0, 0);

    if (newTargetDate <= targetDate) {
      return NextResponse.json(
        { success: false, error: "新的作业日期必须晚于原日期" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {
      scheduledDate: {
        gte: targetDate,
        lte: targetDateEnd,
      },
      status: {
        in: [
          ReservationStatus.PENDING,
          ReservationStatus.APPROVED,
          ReservationStatus.RESCHEDULED,
        ],
      },
    };

    if (village) {
      where.village = village;
    }

    const reservationsToReschedule = await prisma.reservation.findMany({
      where,
      orderBy: [
        { originalOrder: "asc" },
        { scheduledDate: "asc" },
        { createdAt: "asc" },
      ],
    });

    if (reservationsToReschedule.length === 0) {
      return NextResponse.json(
        { success: false, error: "没有找到符合条件的预约记录" },
        { status: 404 }
      );
    }

    const maxOrderResult = await prisma.reservation.aggregate({
      _max: { originalOrder: true },
      where: {
        scheduledDate: {
          gte: newTargetDate,
          lt: new Date(newTargetDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const maxOrder = maxOrderResult._max.originalOrder || 0;

    const results = await prisma.$transaction(async (tx) => {
      const updated = [];

      for (let i = 0; i < reservationsToReschedule.length; i++) {
        const reservation = reservationsToReschedule[i];
        const newOrder = maxOrder + i + 1;

        const updatedRes = await tx.reservation.update({
          where: { id: reservation.id },
          data: {
            scheduledDate: newTargetDate,
            originalDate: reservation.originalDate || reservation.scheduledDate,
            originalOrder: newOrder,
            status: ReservationStatus.RESCHEDULED,
            weatherCondition: "雨天",
            rescheduleReason: reason,
            handledById: auth.user.userId,
            handledAt: new Date(),
            remarks: reservation.remarks
              ? `${reservation.remarks}\n改期原因: ${reason}`
              : `改期原因: ${reason}`,
          },
          include: {
            field: true,
            user: { select: { id: true, realName: true } },
          },
        });

        updated.push(updatedRes);
      }

      await tx.weatherLog.create({
        data: {
          date: targetDate,
          village: village || "全部村庄",
          condition: "雨天",
          rainfall: 10,
          windSpeed: 5,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      data: results,
      message: `已成功将 ${results.length} 条预约记录改期至 ${newDate}，保留原顺序和价格`,
    });
  } catch (error) {
    console.error("Batch reschedule error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
