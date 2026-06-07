import { NextResponse } from "next/server";
import { getMetricsSummary } from "@/repositories/workOrderRepository";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: any = {};
    
    const buildingId = searchParams.get("buildingId");
    const roomType = searchParams.get("roomType");
    const repairType = searchParams.get("repairType");
    const supplierId = searchParams.get("supplierId");
    const month = searchParams.get("month");
    const status = searchParams.get("status");
    const isRepeat = searchParams.get("isRepeat");
    const isHoliday = searchParams.get("isHoliday");
    
    if (buildingId) filters.buildingId = buildingId;
    if (roomType) filters.roomType = roomType;
    if (repairType) filters.repairType = repairType;
    if (supplierId) filters.supplierId = supplierId;
    if (status) filters.status = status;
    if (month) filters.month = month;
    if (isRepeat !== null) filters.isRepeat = isRepeat === "true";
    if (isHoliday !== null) filters.isHoliday = isHoliday === "true";
    
    const metrics = await getMetricsSummary(filters);
    
    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("获取指标总览失败:", error);
    return NextResponse.json(
      { success: false, error: "获取指标总览失败" },
      { status: 500 }
    );
  }
}
