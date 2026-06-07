import { NextRequest } from "next/server";
import { parseFilters } from "../utils";
import { applyFilters, getAllRecords } from "@/lib/etl/pipeline";
import { DATA_DEFINITIONS } from "@/lib/mock/data";

function toCSV(records: Record<string, unknown>[]): string {
  if (records.length === 0) return "";
  const headers = Object.keys(records[0]);
  const headerRow = headers.join(",");
  const rows = records.map((r) =>
    headers
      .map((h) => {
        const val = r[h];
        const str = val === null || val === undefined ? "" : String(val);
        return str.includes(",") || str.includes('"')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(",")
  );
  return [headerRow, ...rows].join("\n");
}

export async function GET(req: NextRequest) {
  const filters = parseFilters(req);

  const allRecords = getAllRecords();
  const records = applyFilters(allRecords, filters);

  const recordsCSV = toCSV(records as unknown as Record<string, unknown>[]);
  const definitionsCSV = toCSV(
    DATA_DEFINITIONS as unknown as Record<string, unknown>[]
  );
  const filtersCSV = toCSV([
    {
      时间范围: `${filters.dateRange.start} 至 ${filters.dateRange.end}`,
      商品筛选: filters.products.join("; ") || "全部",
      店铺筛选: filters.stores.join("; ") || "全部",
      原因筛选: filters.reasons.join("; ") || "全部",
      仓库筛选: filters.warehouses.join("; ") || "全部",
      物流筛选: filters.logistics.join("; ") || "全部",
      生成时间: new Date().toLocaleString("zh-CN"),
    },
  ]);

  const fullCSV = [
    "=== 数据明细 ===",
    recordsCSV,
    "",
    "=== 口径说明 ===",
    definitionsCSV,
    "",
    "=== 筛选条件 ===",
    filtersCSV,
  ].join("\n");

  return new Response(fullCSV, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="return_analysis_${Date.now()}.csv"`,
    },
  });
}
