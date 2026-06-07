import { NextResponse } from "next/server";
import { getSuppliers, getAllSupplierMetrics } from "@/repositories/workOrderRepository";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeMetrics = searchParams.get("includeMetrics") === "true";
    
    let data;
    if (includeMetrics) {
      data = await getAllSupplierMetrics();
    } else {
      data = await getSuppliers();
    }
    
    return NextResponse.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error("获取供应商列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取供应商列表失败" },
      { status: 500 }
    );
  }
}
