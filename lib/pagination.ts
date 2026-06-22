import { redisCache } from "./redis";

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface FilterParams {
  [key: string]: unknown;
}

export interface SortParams {
  field: string;
  order: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function parsePaginationParams(
  searchParams: URLSearchParams
): PaginationParams {
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
  return {
    page: Math.max(1, page),
    pageSize: Math.min(100, Math.max(1, pageSize)),
  };
}

export function parseSortParams(searchParams: URLSearchParams): SortParams | null {
  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | null;

  if (!sortBy) return null;

  return {
    field: sortBy,
    order: sortOrder === "desc" ? "desc" : "asc",
  };
}

export function buildFilterParams(searchParams: URLSearchParams): FilterParams {
  const filters: FilterParams = {};
  const excludeKeys = ["page", "pageSize", "sortBy", "sortOrder"];

  for (const [key, value] of searchParams.entries()) {
    if (excludeKeys.includes(key)) continue;
    if (value === "" || value === null || value === undefined) continue;

    if (value === "true" || value === "false") {
      filters[key] = value === "true";
    } else if (!isNaN(Number(value)) && value !== "") {
      filters[key] = Number(value);
    } else {
      filters[key] = value;
    }
  }

  return filters;
}

export function createPrismaPagination({
  page,
  pageSize,
}: PaginationParams): { skip: number; take: number } {
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function createPaginatedResult<T>(
  data: T[],
  total: number,
  { page, pageSize }: PaginationParams
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / pageSize);
  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export async function withCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = await redisCache.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const result = await fetchFn();
  await redisCache.set(cacheKey, result, ttl);
  return result;
}

export function invalidateCachePattern(pattern: string): Promise<void> {
  return redisCache.delPattern(pattern);
}
