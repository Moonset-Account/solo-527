import { NextRequest, NextResponse } from "next/server";
import { UserRole, ReservationStatus } from "@/lib/types";
import prisma from "@/lib/prisma";
import { authenticateRequest, requireRole } from "@/lib/auth";
import {
  validate,
  approveReservationSchema,
  rejectReservationSchema,
  withdrawReservationSchema,
  createReservationSchema,
} from "@/lib/validation";

export async function GET(
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

  try {
    const id = parseInt(params.id, 10);
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        field: true,
        machinery: true,
        contract: true,
        dispatch: { include: { driver: true, machinery: true } },
        settlement: true,
        user: { select: { id: true, realName: true, username: true } },
        handledBy: { select: { id: true, realName: true } },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: "预约记录不存在" },
        { status: 404 }
      );
    }

    if (
      auth.user.role === UserRole.EXTERNAL &&
      reservation.userId !== auth.user.userId
    ) {
      return NextResponse.json(
        { success: false, error: "无权查看该预约记录" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    console.error("Get reservation error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

  try {
    const id = parseInt(params.id, 10);
    const existing = await prisma.reservation.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "预约记录不存在" },
        { status: 404 }
      );
    }

    if (
      auth.user.role === UserRole.EXTERNAL &&
      existing.userId !== auth.user.userId
    ) {
      return NextResponse.json(
        { success: false, error: "无权修改该预约记录" },
        { status: 403 }
      );
    }

    if (
      existing.status !== ReservationStatus.PENDING &&
      auth.user.role === UserRole.EXTERNAL
    ) {
      return NextResponse.json(
        { success: false, error: "只能修改待审批状态的预约" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validation = validate(createReservationSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const data = validation.data!;
    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        fieldId: data.fieldId,
        operationType: data.operationType,
        scheduledDate: new Date(data.scheduledDate),
        area: data.area,
        pricePerMu: data.pricePerMu,
        totalAmount: data.area * data.pricePerMu,
        village: data.village,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contractId: data.contractId,
        remarks: data.remarks,
      },
      include: {
        field: true,
        machinery: true,
        user: { select: { id: true, realName: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: reservation,
      message: "预约更新成功",
    });
  } catch (error) {
    console.error("Update reservation error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

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

  const action = new URL(req.url).searchParams.get("action");

  try {
    const id = parseInt(params.id, 10);
    const existing = await prisma.reservation.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "预约记录不存在" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      const roleCheck = requireRole(auth.user, [UserRole.INTERNAL]);
      if (!roleCheck.allowed) {
        return NextResponse.json(
          { success: false, error: roleCheck.error },
          { status: 403 }
        );
      }

      if (existing.status !== ReservationStatus.PENDING) {
        return NextResponse.json(
          { success: false, error: "只能审批待审批状态的预约" },
          { status: 400 }
        );
      }

      const body = await req.json();
      const validation = validate(approveReservationSchema, body);
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        );
      }

      const reservation = await prisma.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.APPROVED,
          handledById: auth.user.userId,
          remarks: validation.data?.remarks || existing.remarks,
        },
        include: {
          field: true,
          user: { select: { id: true, realName: true } },
          handledBy: { select: { id: true, realName: true } },
        },
      });

      return NextResponse.json({
        success: true,
        data: reservation,
        message: "预约审批通过",
      });
    }

    if (action === "reject") {
      const roleCheck = requireRole(auth.user, [UserRole.INTERNAL]);
      if (!roleCheck.allowed) {
        return NextResponse.json(
          { success: false, error: roleCheck.error },
          { status: 403 }
        );
      }

      if (existing.status !== ReservationStatus.PENDING) {
        return NextResponse.json(
          { success: false, error: "只能拒绝待审批状态的预约" },
          { status: 400 }
        );
      }

      const body = await req.json();
      const validation = validate(rejectReservationSchema, body);
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        );
      }

      const reservation = await prisma.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.REJECTED,
          handledById: auth.user.userId,
          handledAt: new Date(),
          remarks: validation.data?.reason,
        },
        include: {
          field: true,
          user: { select: { id: true, realName: true } },
          handledBy: { select: { id: true, realName: true } },
        },
      });

      return NextResponse.json({
        success: true,
        data: reservation,
        message: "预约已拒绝",
      });
    }

    if (action === "withdraw") {
      if (
        auth.user.role === UserRole.EXTERNAL &&
        existing.userId !== auth.user.userId
      ) {
        return NextResponse.json(
          { success: false, error: "无权撤回该预约" },
          { status: 403 }
        );
      }

      if (
        existing.status !== ReservationStatus.PENDING &&
        existing.status !== ReservationStatus.APPROVED
      ) {
        return NextResponse.json(
          { success: false, error: "只能撤回待审批或已审批状态的预约" },
          { status: 400 }
        );
      }

      const body = await req.json();
      const validation = validate(withdrawReservationSchema, body);
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        );
      }

      const reservation = await prisma.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.CANCELLED,
          remarks: validation.data?.reason
            ? `${existing.remarks || ""}\n撤回原因: ${validation.data.reason}`.trim()
            : existing.remarks,
        },
        include: {
          field: true,
          user: { select: { id: true, realName: true } },
        },
      });

      return NextResponse.json({
        success: true,
        data: reservation,
        message: "预约已撤回",
      });
    }

    return NextResponse.json(
      { success: false, error: "无效的操作类型" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Reservation action error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
