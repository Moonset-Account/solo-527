import { NextResponse } from "next/server";
import { queryDatabase, isUsingMockData } from "@/lib/db";
import { generateWorkOrders } from "@/mock/data";

export async function POST() {
  try {
    if (isUsingMockData()) {
      return NextResponse.json({
        success: true,
        message: "Mock 模式下使用内存数据，无需初始化数据库",
      });
    }
    
    const mockOrders = generateWorkOrders(200);
    
    for (const order of mockOrders) {
      const sql = `
        INSERT INTO work_orders (
          id, order_no, building_id, building_name, room_no, room_type,
          repair_type, supplier_id, supplier_name, status, tenant_name,
          tenant_rating, tenant_feedback, parent_order_id, parent_order_no,
          is_repeat, is_holiday, created_at, responded_at, completed_at,
          response_time, lng, lat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        ON CONFLICT (id) DO NOTHING
      `;
      
      await queryDatabase(sql, [
        order.id,
        order.orderNo,
        order.buildingId,
        order.buildingName,
        order.roomNo,
        order.roomType,
        order.repairType,
        order.supplierId,
        order.supplierName,
        order.status,
        order.tenantName,
        order.tenantRating,
        order.tenantFeedback,
        order.parentOrderId,
        order.parentOrderNo,
        order.isRepeat,
        order.isHoliday,
        order.createdAt,
        order.respondedAt,
        order.completedAt,
        order.responseTime,
        order.location?.lng,
        order.location?.lat,
      ]);
    }
    
    await queryDatabase("SELECT clean_work_order_lifecycle()");
    await queryDatabase("SELECT refresh_supplier_metrics_cache()");
    
    return NextResponse.json({
      success: true,
      message: `已初始化 ${mockOrders.length} 条工单数据，并完成清洗和缓存刷新`,
      count: mockOrders.length,
    });
  } catch (error) {
    console.error("初始化数据失败:", error);
    return NextResponse.json(
      { success: false, error: "初始化数据失败" },
      { status: 500 }
    );
  }
}
