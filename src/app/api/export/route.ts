import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";
import { authenticateRequest, requireRole } from "@/lib/auth";
import { getPrismaWhereFromFilter, formatDate, formatCurrency } from "@/lib/utils";
import {
  MACHINERY_TYPE_LABELS,
  RESERVATION_STATUS_LABELS,
  UserRole,
  ReservationStatus,
} from "@/lib/types";

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
    const type = searchParams.get("type") || "reservations";

    const filters: Record<string, unknown> = {};
    const status = searchParams.get("status");
    const village = searchParams.get("village");
    const operationType = searchParams.get("operationType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (status) filters.status = status;
    if (village) filters.village = village;
    if (operationType) filters.operationType = operationType;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const where = getPrismaWhereFromFilter(filters);

    if (type === "reservations") {
      const reservations = await prisma.reservation.findMany({
        where,
        include: {
          field: true,
          machinery: true,
          user: { select: { realName: true } },
          handledBy: { select: { realName: true } },
        },
        orderBy: [{ originalOrder: "asc" }, { scheduledDate: "asc" }],
      });

      const exportData = reservations.map((r, idx) => ({
        "序号": idx + 1,
        "预约编号": r.reservationNo,
        "村庄": r.village,
        "作业类型": MACHINERY_TYPE_LABELS[r.operationType as keyof typeof MACHINERY_TYPE_LABELS],
        "预约日期": formatDate(r.scheduledDate),
        "原预约日期": r.originalDate ? formatDate(r.originalDate) : "-",
        "预约顺序": r.originalOrder || "-",
        "作业面积(亩)": r.area,
        "单价(元/亩)": r.pricePerMu,
        "总金额(元)": r.totalAmount,
        "联系人": r.contactName,
        "联系电话": r.contactPhone,
        "状态": RESERVATION_STATUS_LABELS[r.status as keyof typeof RESERVATION_STATUS_LABELS],
        "地块位置": r.field?.location || "-",
        "农机": r.machinery?.name || "-",
        "申请人": r.user?.realName || "-",
        "处理人": r.handledBy?.realName || "-",
        "天气": r.weatherCondition || "-",
        "改期原因": r.rescheduleReason || "-",
        "备注": r.remarks || "-",
        "创建时间": formatDate(r.createdAt),
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, "作业预约");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const filename = `作业预约导出_${formatDate(new Date())}.xlsx`;

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="${encodeURIComponent(
            filename
          )}"`,
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    if (type === "settlements") {
      const settlements = await prisma.settlement.findMany({
        include: {
          reservation: {
            include: {
              field: true,
              machinery: true,
              user: { select: { realName: true } },
            },
          },
          user: { select: { realName: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const exportData = settlements.map((s, idx) => ({
        "序号": idx + 1,
        "结算编号": s.settlementNo,
        "村庄": s.reservation?.village || "-",
        "作业类型": s.reservation
          ? MACHINERY_TYPE_LABELS[s.reservation.operationType as keyof typeof MACHINERY_TYPE_LABELS]
          : "-",
        "实际面积(亩)": s.actualArea,
        "单价(元/亩)": s.pricePerMu,
        "总金额(元)": formatCurrency(s.totalAmount),
        "油料成本(元)": formatCurrency(s.fuelCost),
        "维修成本(元)": formatCurrency(s.maintenanceCost),
        "其他成本(元)": formatCurrency(s.otherCost),
        "净收入(元)": formatCurrency(s.netIncome),
        "农户": s.user?.realName || "-",
        "农机": s.reservation?.machinery?.name || "-",
        "地块": s.reservation?.field?.location || "-",
        "状态": s.status === "PAID" ? "已结算" : "待结算",
        "结算日期": s.settledDate ? formatDate(s.settledDate) : "-",
        "备注": s.remarks || "-",
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, "收益结算");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const filename = `收益结算导出_${formatDate(new Date())}.xlsx`;

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="${encodeURIComponent(
            filename
          )}"`,
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "不支持的导出类型" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { success: false, error: "导出失败，服务器内部错误" },
      { status: 500 }
    );
  }
}
