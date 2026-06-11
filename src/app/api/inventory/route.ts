import { NextResponse } from "next/server";
import { getInventoryItems, updateInventoryQuantity } from "@/services/inventoryService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId") || undefined;
    const siteName = searchParams.get("siteName") || undefined;
    const sku = searchParams.get("sku") || undefined;
    const productName = searchParams.get("productName") || undefined;
    const lowStock = searchParams.get("lowStock") === "true";
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined;
    const pageSize = searchParams.get("pageSize")
      ? parseInt(searchParams.get("pageSize")!)
      : undefined;

    const result = await getInventoryItems({
      siteId,
      siteName,
      sku,
      productName,
      lowStock,
      page,
      pageSize,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (error) {
    console.error("Error in GET /api/inventory:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, id, quantity, reservedQuantity } = body;

    if (action === "updateQuantity") {
      const success = await updateInventoryQuantity(id, quantity, reservedQuantity);
      return NextResponse.json({ success });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in POST /api/inventory:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process inventory" },
      { status: 500 }
    );
  }
}
