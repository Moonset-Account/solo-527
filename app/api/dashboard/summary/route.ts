import { NextRequest } from "next/server";
import { parseFilters, jsonResponse, getPrevDateRange } from "../../utils";
import { applyFilters, computeSummary, getAllRecords } from "@/lib/etl/pipeline";
import { cache, generateCacheKey, hashFilters, getTtlForDateRange } from "@/lib/cache";
import { differenceInDays } from "date-fns";

export async function GET(req: NextRequest) {
  const filters = parseFilters(req);
  const filterHash = hashFilters(filters);
  const cacheKey = generateCacheKey("summary", filters.dateRange, filterHash);

  const cached = cache.get(cacheKey);
  if (cached) {
    return jsonResponse(cached);
  }

  const allRecords = getAllRecords();
  const currentRecords = applyFilters(allRecords, filters);

  const prevRange = getPrevDateRange(filters.dateRange);
  const prevRecords = applyFilters(allRecords, {
    ...filters,
    dateRange: prevRange,
  });

  const data = computeSummary(currentRecords, prevRecords);

  const days = differenceInDays(
    new Date(filters.dateRange.end),
    new Date(filters.dateRange.start)
  );
  const ttl = getTtlForDateRange(days);
  cache.set(cacheKey, data, ttl);

  return jsonResponse(data);
}
