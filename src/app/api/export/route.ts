import { NextResponse } from "next/server";
import { getWorkOrders } from "@/repositories/workOrderRepository";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: any = {};
    
    const buildingId = searchParams.get("buildingId");
    const roomType = searchParams.get("roomType");
    const repairType = searchParams.get("repairType");
    const supplierId = searchParams.get("supplierId");
    const status = searchParams.get("status");
    const month = searchParams.get("month");
    const isRepeat = searchParams.get("isRepeat");
    const isHoliday = searchParams.get("isHoliday");
    const format = searchParams.get("format") || "csv";
    
    if (buildingId) filters.buildingId = buildingId;
    if (roomType) filters.roomType = roomType;
    if (repairType) filters.repairType = repairType;
    if (supplierId) filters.supplierId = supplierId;
    if (status) filters.status = status;
    if (month) filters.month = month;
    if (isRepeat !== null) filters.isRepeat = isRepeat === "true";
    if (isHoliday !== null) filters.isHoliday = isHoliday === "true";
    
    const workOrders = await getWorkOrders(filters);
    
    const exportData = workOrders.map((order: any) => ({
      "工单编号": order.orderNo,
      "楼栋": order.buildingName,
      "房间号": order.roomNo,
      "房型": order.roomType,
      "维修类型": order.repairType,
      "供应商": order.supplierName,
      "状态": order.status,
      "响应时长(分钟)": order.responseTime || "-",
      "是否复修": order.isRepeat ? "是" : "否",
      "关联原工单": order.parentOrderNo || "-",
      "是否节假日": order.isHoliday ? "是" : "否",
      "租户评分": order.tenantRating || "-",
      "创建时间": order.createdAt ? new Date(order.createdAt).toLocaleString("zh-CN") : "-",
      "完成时间": order.completedAt ? new Date(order.completedAt).toLocaleString("zh-CN") : "-",
    }));
    
    const timestamp = new Date().toISOString().slice(0, 10);
    let buffer: Buffer;
    let contentType: string;
    let fileName: string;
    
    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "工单列表");
      buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      fileName = `维修工单_${timestamp}.xlsx`;
    } else {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      buffer = XLSX.write(worksheet, { type: "buffer", bookType: "csv" });
      contentType = "text/csv; charset=utf-8";
      fileName = `维修工单_${timestamp}.csv`;
    }
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("导出数据失败:", error);
    return NextResponse.json(
      { success: false, error: "导出数据失败" },
      { status: 500 }
    );
  }
}
