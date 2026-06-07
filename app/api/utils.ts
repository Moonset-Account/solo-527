import { NextRequest } from "next/server";
import type { FilterParams } from "@/lib/types";
import { addDays, format } from "date-fns";

export function parseFilters(req: NextRequest): FilterParams {
  const searchParams = req.nextUrl.searchParams;

  const timeWindow =
    (searchParams.get("timeWindow") as FilterParams["timeWindow"]) || "7d";

  let startDate: string;
  let endDate: string;
  const today = new Date();

  if (searchParams.get("start") && searchParams.get("end")) {
    startDate = searchParams.get("start")!;
    endDate = searchParams.get("end")!;
  } else {
    switch (timeWindow) {
      case "today":
        startDate = format(today, "yyyy-MM-dd");
        endDate = format(today, "yyyy-MM-dd");
        break;
      case "30d":
        startDate = format(addDays(today, -30), "yyyy-MM-dd");
        endDate = format(today, "yyyy-MM-dd");
        break;
      case "7d":
      default:
        startDate = format(addDays(today, -7), "yyyy-MM-dd");
        endDate = format(today, "yyyy-MM-dd");
        break;
    }
  }

  const parseArray = (key: string): string[] => {
    const val = searchParams.get(key);
    return val ? val.split(",").filter(Boolean) : [];
  };

  return {
    dateRange: { start: startDate, end: endDate },
    timeWindow,
    products: parseArray("products"),
    stores: parseArray("stores"),
    reasons: parseArray("reasons"),
    warehouses: parseArray("warehouses"),
    logistics: parseArray("logistics"),
  };
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export function getPrevDateRange(dateRange: { start: string; end: string }) {
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days);
  return {
    start: format(prevStart, "yyyy-MM-dd"),
    end: format(prevEnd, "yyyy-MM-dd"),
  };
}
