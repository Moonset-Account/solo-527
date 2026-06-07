import { NextRequest } from "next/server";
import { parseFilters, jsonResponse } from "../../utils";
import { applyFilters, computeCycleDistribution, getAllRecords } from "@/lib/etl/pipeline";
import { cache, generateCacheKey, hashFilters, getTtlForDateRange } from "@/lib/cache";
import { differenceInDays } from "date-fns";

export async function GET(req: NextRequest) {
  const filters = parseFilters(req);
  const filterHash = hashFilters(filters);
  const cacheKey = generateCacheKey("cycle", filters.dateRange, filterHash);

  const cached = cache.get(cacheKey);
  if (cached) {
    return jsonResponse(cached);
  }

  const allRecords = getAllRecords();
  const records = applyFilters(allRecords, filters);
  const data = computeCycleDistribution(records);

  const days = differenceInDays(
    new Date(filters.dateRange.end),
    new Date(filters.dateRange.start)
  );
  const ttl = getTtlForDateRange(days);
  cache.set(cacheKey, data, ttl);

  return jsonResponse(data);
}
