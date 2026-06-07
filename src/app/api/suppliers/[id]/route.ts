import { NextResponse } from "next/server";
import { getSupplierMetrics, getWorkOrders } from "@/repositories/workOrderRepository";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supplierId = params.id;
    const metrics = await getSupplierMetrics(supplierId);
    
    if (!metrics) {
      return NextResponse.json(
        { success: false, error: "供应商不存在" },
        { status: 404 }
      );
    }
    
    const workOrders = await getWorkOrders({ supplierId });
    
    return NextResponse.json({
      success: true,
      data: {
        ...metrics,
        workOrders,
      },
    });
  } catch (error) {
    console.error("获取供应商详情失败:", error);
    return NextResponse.json(
      { success: false, error: "获取供应商详情失败" },
      { status: 500 }
    );
  }
}
