import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { auth } from "@clerk/nextjs/server";

function csvEscape(value: any): string {
  if (value === null || value === undefined) return "";
  let str = String(value);
  if (typeof value === "object" && typeof value.toNumber === "function") {
    str = String(value.toNumber());
  }
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateVehicleCsv(vehicles: any[]): string {
  const headers = [
    "ID",
    "车牌号",
    "车架号",
    "品牌",
    "型号",
    "年款",
    "颜色",
    "车主姓名",
    "车主电话",
    "里程数",
    "创建时间",
  ];
  const rows = vehicles.map((v) => [
    v.id,
    v.plateNumber,
    v.vin,
    v.brand,
    v.model,
    v.year,
    v.color,
    v.ownerName,
    v.ownerPhone,
    v.mileage,
    new Date(v.createdAt).toLocaleString("zh-CN"),
  ]);

  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

function generateWorkOrderCsv(workOrders: any[]): string {
  const headers = [
    "工单号",
    "车牌号",
    "车主",
    "状态",
    "优先级",
    "预计交付",
    "实际交付",
    "描述",
    "工时费",
    "配件费",
    "总费用",
    "创建时间",
  ];
  const rows = workOrders.map((wo) => [
    wo.orderNo,
    wo.vehicle?.plateNumber || "",
    wo.vehicle?.ownerName || "",
    wo.status,
    wo.priority,
    wo.estimatedDelivery
      ? new Date(wo.estimatedDelivery).toLocaleDateString("zh-CN")
      : "",
    wo.actualDelivery
      ? new Date(wo.actualDelivery).toLocaleDateString("zh-CN")
      : "",
    wo.description,
    Number(wo.totalLaborCost || 0),
    Number(wo.totalPartCost || 0),
    Number(wo.totalCost || 0),
    new Date(wo.createdAt).toLocaleString("zh-CN"),
  ]);

  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

function generatePartCsv(parts: any[]): string {
  const headers = [
    "编码",
    "名称",
    "分类",
    "单位",
    "销售价",
    "成本价",
    "库存",
    "安全库存",
    "存放位置",
    "创建时间",
  ];
  const rows = parts.map((p) => [
    p.code,
    p.name,
    p.category,
    p.unit,
    Number(p.price),
    Number(p.costPrice),
    p.stock,
    p.minStock,
    p.location,
    new Date(p.createdAt).toLocaleString("zh-CN"),
  ]);

  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

function generateInventoryCsv(records: any[]): string {
  const headers = [
    "ID",
    "配件编码",
    "配件名称",
    "类型",
    "数量",
    "结存",
    "工单号",
    "备注",
    "操作时间",
  ];
  const rows = records.map((r) => [
    r.id,
    r.part?.code || "",
    r.part?.name || "",
    r.type,
    r.quantity,
    r.balanceAfter,
    r.workOrder?.orderNo || "",
    r.remark || "",
    new Date(r.createdAt).toLocaleString("zh-CN"),
  ]);

  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

function generateScheduleCsv(schedules: any[]): string {
  const headers = [
    "ID",
    "班组",
    "工单号",
    "车牌号",
    "日期",
    "开始时间",
    "结束时间",
    "状态",
    "创建时间",
  ];
  const rows = schedules.map((s) => [
    s.id,
    s.team?.name || "",
    s.workOrder?.orderNo || "",
    s.workOrder?.vehicle?.plateNumber || "",
    new Date(s.scheduledDate).toLocaleDateString("zh-CN"),
    s.startTime,
    s.endTime,
    s.status,
    new Date(s.createdAt).toLocaleString("zh-CN"),
  ]);

  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

function generateQualityCsv(checks: any[]): string {
  const headers = [
    "ID",
    "工单号",
    "车牌号",
    "结果",
    "备注",
    "检测时间",
    "检测人ID",
  ];
  const rows = checks.map((q) => [
    q.id,
    q.workOrder?.orderNo || "",
    q.workOrder?.vehicle?.plateNumber || "",
    q.result,
    q.remarks || "",
    q.checkedAt ? new Date(q.checkedAt).toLocaleString("zh-CN") : "",
    q.inspectorId || "",
  ]);

  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

const typeFilenames: Record<string, string> = {
  VEHICLES: "车辆数据导出",
  WORK_ORDERS: "工单数据导出",
  PARTS: "配件数据导出",
  INVENTORY: "库存记录导出",
  SCHEDULES: "排期数据导出",
  QUALITY_CHECKS: "质检数据导出",
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.exportTask.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: "导出任务不存在" }, { status: 404 });
    }

    if (task.createdBy !== userId) {
      return NextResponse.json({ error: "无权访问此导出任务" }, { status: 403 });
    }

    if (task.status === "FAILED") {
      const errorMessage = task.errorMessage as string | null;
      return NextResponse.json(
        { error: errorMessage || "导出失败" },
        { status: 500 }
      );
    }

    if (task.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "导出尚未完成", status: task.status },
        { status: 202 }
      );
    }

    let csvContent = "";
    const filename = typeFilenames[task.type] || "数据导出";

    switch (task.type) {
      case "VEHICLES": {
        const vehicles = await prisma.vehicle.findMany({
          orderBy: { createdAt: "desc" },
        });
        csvContent = generateVehicleCsv(vehicles);
        break;
      }
      case "WORK_ORDERS": {
        const workOrders = await prisma.workOrder.findMany({
          include: { vehicle: true },
          orderBy: { createdAt: "desc" },
        });
        csvContent = generateWorkOrderCsv(workOrders);
        break;
      }
      case "PARTS": {
        const parts = await prisma.part.findMany({
          orderBy: { createdAt: "desc" },
        });
        csvContent = generatePartCsv(parts);
        break;
      }
      case "INVENTORY": {
        const records = await prisma.inventoryRecord.findMany({
          include: { part: true, workOrder: { select: { orderNo: true } } },
          orderBy: { createdAt: "desc" },
        });
        csvContent = generateInventoryCsv(records);
        break;
      }
      case "SCHEDULES": {
        const schedules = await prisma.schedule.findMany({
          include: {
            team: { select: { name: true } },
            workOrder: {
              include: { vehicle: { select: { plateNumber: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
        });
        csvContent = generateScheduleCsv(schedules);
        break;
      }
      case "QUALITY_CHECKS": {
        const checks = await prisma.qualityCheck.findMany({
          include: {
            workOrder: {
              include: { vehicle: { select: { plateNumber: true } } },
            },
          },
          orderBy: { checkedAt: "desc" },
        });
        csvContent = generateQualityCsv(checks);
        break;
      }
      default:
        return NextResponse.json({ error: "未知的导出类型" }, { status: 400 });
    }

    const timestamp = new Date().toISOString().split("T")[0];
    const downloadFilename = encodeURIComponent(`${filename}_${timestamp}.csv`);

    const utf8Bom = "\uFEFF";
    const csvWithBom = utf8Bom + csvContent;

    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${downloadFilename}"`,
      },
    });
  } catch (error) {
    console.error("Export download error:", error);
    return NextResponse.json(
      { error: "下载失败，请稍后重试" },
      { status: 500 }
    );
  }
}
