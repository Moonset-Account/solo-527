import { NextRequest, NextResponse } from "next/server";
import { UserRole, ReservationStatus } from "@/lib/types";
import prisma from "@/lib/prisma";
import { authenticateRequest, requireRole } from "@/lib/auth";
import { validate, createReservationSchema } from "@/lib/validation";
import { generateNo, parsePagination, getPrismaWhereFromFilter } from "@/lib/utils";

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

    const filters: Record<string, unknown> = {};
    const status = searchParams.get("status");
    const village = searchParams.get("village");
    const operationType = searchParams.get("operationType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const machineryId = searchParams.get("machineryId");
    const search = searchParams.get("search");

    if (status) filters.status = status;
    if (village) filters.village = village;
    if (operationType) filters.operationType = operationType;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (machineryId) filters.machineryId = parseInt(machineryId, 10);
    if (search) filters.search = search;

    if (auth.user.role === UserRole.EXTERNAL) {
      filters.userId = auth.user.userId;
    }

    const where = getPrismaWhereFromFilter(filters);

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        skip,
        take,
        include: {
          field: true,
          machinery: true,
          user: { select: { id: true, realName: true, username: true } },
          handledBy: { select: { id: true, realName: true } },
        },
        orderBy: [{ originalOrder: "asc" }, { scheduledDate: "asc" }, { createdAt: "asc" }],
      }),
      prisma.reservation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: reservations,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Get reservations error:", error);
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

  try {
    const body = await req.json();
    const validation = validate(createReservationSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const data = validation.data!;

    const field = await prisma.field.findUnique({
      where: { id: data.fieldId },
    });
    if (!field) {
      return NextResponse.json(
        { success: false, error: "作业地块不存在" },
        { status: 404 }
      );
    }

    const maxOrder = await prisma.reservation.aggregate({
      _max: { originalOrder: true },
      where: { scheduledDate: new Date(data.scheduledDate) },
    });

    const reservation = await prisma.reservation.create({
      data: {
        reservationNo: generateNo("RES"),
        userId: auth.user.userId,
        fieldId: data.fieldId,
        contractId: data.contractId,
        operationType: data.operationType,
        scheduledDate: new Date(data.scheduledDate),
        originalDate: new Date(data.scheduledDate),
        originalOrder: (maxOrder._max.originalOrder || 0) + 1,
        area: data.area,
        pricePerMu: data.pricePerMu,
        totalAmount: data.area * data.pricePerMu,
        status: ReservationStatus.PENDING,
        village: data.village,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        remarks: data.remarks,
      },
      include: {
        field: true,
        machinery: true,
        user: { select: { id: true, realName: true } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: reservation,
        message: "作业预约提交成功，等待审批",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create reservation error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
