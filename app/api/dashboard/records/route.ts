import { NextRequest } from "next/server";
import { parseFilters, jsonResponse } from "../../utils";
import { applyFilters, getAllRecords } from "@/lib/etl/pipeline";
import { validateRecords } from "@/lib/validator";

export async function GET(req: NextRequest) {
  const filters = parseFilters(req);
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  const allRecords = getAllRecords();
  const filtered = applyFilters(allRecords, filters);

  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);
  const validation = validateRecords(filtered);

  return jsonResponse({
    records: paginated,
    total: filtered.length,
    page,
    pageSize,
    validation,
  });
}
