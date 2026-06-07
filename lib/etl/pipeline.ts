import { generateMockRecords } from "@/lib/mock/data";
import { identifyRepeatUsers } from "@/lib/privacy";
import type {
  FilterParams,
  ReturnRecord,
  SummaryData,
  ReasonNode,
  CycleDistribution,
  ProductRank,
  ServiceMetrics,
} from "@/lib/types";

let cachedRecords: ReturnRecord[] | null = null;

function getAllRecords(): ReturnRecord[] {
  if (!cachedRecords) {
    cachedRecords = generateMockRecords(800, 60) as ReturnRecord[];
  }
  return cachedRecords;
}

export function applyFilters(
  records: ReturnRecord[],
  filters: FilterParams
): ReturnRecord[] {
  return records.filter((r) => {
    const applyDate = new Date(r.applyTime);
    const startDate = new Date(filters.dateRange.start);
    const endDate = new Date(filters.dateRange.end);
    endDate.setHours(23, 59, 59, 999);

    if (applyDate < startDate || applyDate > endDate) return false;
    if (filters.products.length > 0 && !filters.products.includes(r.sku)) return false;
    if (filters.stores.length > 0 && !filters.stores.includes(r.storeId)) return false;
    if (filters.reasons.length > 0) {
      const matched = filters.reasons.some((f) => {
        if (f.includes(":")) {
          const [cat, detail] = f.split(":");
          return r.reason === cat && r.reasonDetail === detail;
        }
        return r.reason === f;
      });
      if (!matched) return false;
    }
    if (filters.warehouses.length > 0 && !filters.warehouses.includes(r.warehouseId)) return false;
    if (filters.logistics.length > 0 && !filters.logistics.includes(r.logisticsId)) return false;

    return true;
  });
}

export function computeSummary(
  records: ReturnRecord[],
  prevRecords: ReturnRecord[]
): SummaryData {
  const sampleSize = records.length;
  const totalReturns = records.length;
  const totalOrders = records.length * 15;
  const returnRate = Number(((totalReturns / totalOrders) * 100).toFixed(2));
  const avgRefundCycle = Number(
    (records.reduce((s, r) => s + r.refundCycle, 0) / Math.max(1, records.length)).toFixed(1)
  );
  const avgServiceTime = Math.round(
    records.reduce((s, r) => s + r.serviceHandleTime, 0) / Math.max(1, records.length)
  );

  const userHashes = records.map((r) => r.userHash);
  const repeatUsers = identifyRepeatUsers(userHashes, 3);
  const repeatUserRecords = records.filter((r) => repeatUsers.has(r.userHash));
  const repeatUserRate = Number(((repeatUserRecords.length / Math.max(1, records.length)) * 100).toFixed(1));

  const prevAvgCycle =
    prevRecords.length > 0
      ? prevRecords.reduce((s, r) => s + r.refundCycle, 0) / prevRecords.length
      : avgRefundCycle;
  const prevAvgService =
    prevRecords.length > 0
      ? prevRecords.reduce((s, r) => s + r.serviceHandleTime, 0) / prevRecords.length
      : avgServiceTime;

  const trendReturns = prevRecords.length > 0 ? records.length - prevRecords.length : 0;
  const trendRefundCycle = Number((avgRefundCycle - prevAvgCycle).toFixed(1));
  const trendServiceTime = Math.round(avgServiceTime - prevAvgService);

  const missingFields = records.filter(
    (r) => !r.qualityTime || !r.refundTime || !r.agentId
  ).length;

  return {
    totalReturns,
    returnRate,
    avgRefundCycle,
    avgServiceTime,
    repeatUserRate,
    sampleSize,
    trend: {
      returns: trendReturns,
      refundCycle: trendRefundCycle,
      serviceTime: trendServiceTime,
    },
    validation: {
      dataConsistency: Number((1 - missingFields / Math.max(1, records.length)).toFixed(3)),
      missingFields,
      lastUpdate: new Date().toISOString(),
    },
  };
}

export function computeReasonTree(records: ReturnRecord[]): ReasonNode {
  const categoryMap = new Map<string, Map<string, number>>();

  for (const r of records) {
    if (!categoryMap.has(r.reason)) {
      categoryMap.set(r.reason, new Map());
    }
    const detailMap = categoryMap.get(r.reason)!;
    detailMap.set(r.reasonDetail, (detailMap.get(r.reasonDetail) || 0) + 1);
  }

  const children: ReasonNode[] = [];
  for (const [category, detailMap] of categoryMap.entries()) {
    const detailChildren: ReasonNode[] = [];
    let catValue = 0;
    for (const [detail, count] of detailMap.entries()) {
      detailChildren.push({
        name: detail,
        value: count,
        path: `${category}/${detail}`,
      });
      catValue += count;
    }
    children.push({
      name: category,
      value: catValue,
      children: detailChildren,
      path: category,
    });
  }

  return {
    name: "全部原因",
    value: records.length,
    children,
    path: "",
  };
}

export function computeCycleDistribution(records: ReturnRecord[]): CycleDistribution {
  const cycles = records.map((r) => r.refundCycle).sort((a, b) => a - b);

  const bins = [
    { range: "0-1天", min: 0, max: 1 },
    { range: "1-2天", min: 1, max: 2 },
    { range: "2-3天", min: 2, max: 3 },
    { range: "3-5天", min: 3, max: 5 },
    { range: "5-7天", min: 5, max: 7 },
    { range: "7-14天", min: 7, max: 14 },
    { range: "14天以上", min: 14, max: Infinity },
  ];

  const binned = bins.map((b) => {
    const matched = cycles.filter((c) => c >= b.min && c < b.max);
    return {
      range: b.range,
      count: matched.length,
      avgDays: matched.length > 0
        ? Number((matched.reduce((s, v) => s + v, 0) / matched.length).toFixed(1))
        : 0,
    };
  });

  const p50 = cycles[Math.floor(cycles.length * 0.5)] || 0;
  const p90 = cycles[Math.floor(cycles.length * 0.9)] || 0;
  const p99 = cycles[Math.floor(cycles.length * 0.99)] || 0;

  const applyToQuality = records.map((r) => {
    const a = new Date(r.applyTime).getTime();
    const q = new Date(r.qualityTime).getTime();
    return (q - a) / (1000 * 60 * 60 * 24);
  });
  const qualityToRefund = records.map((r) => {
    const q = new Date(r.qualityTime).getTime();
    const rf = new Date(r.refundTime).getTime();
    return (rf - q) / (1000 * 60 * 60 * 24);
  });

  return {
    bins: binned,
    percentiles: {
      p50: Number(p50.toFixed(1)),
      p90: Number(p90.toFixed(1)),
      p99: Number(p99.toFixed(1)),
    },
    stageBreakdown: {
      applyToQuality: Number((applyToQuality.reduce((s, v) => s + v, 0) / applyToQuality.length).toFixed(1)),
      qualityToRefund: Number((qualityToRefund.reduce((s, v) => s + v, 0) / qualityToRefund.length).toFixed(1)),
      total: Number((cycles.reduce((s, v) => s + v, 0) / cycles.length).toFixed(1)),
    },
  };
}

export function computeProductRanking(records: ReturnRecord[]): ProductRank[] {
  const productMap = new Map<
    string,
    { name: string; category: string; returns: number; reasons: Map<string, number> }
  >();

  for (const r of records) {
    if (!productMap.has(r.sku)) {
      productMap.set(r.sku, {
        name: r.productName,
        category: r.category,
        returns: 0,
        reasons: new Map(),
      });
    }
    const p = productMap.get(r.sku)!;
    p.returns++;
    p.reasons.set(r.reason, (p.reasons.get(r.reason) || 0) + 1);
  }

  const ranking: ProductRank[] = [];
  for (const [sku, data] of productMap.entries()) {
    const topReason = Array.from(data.reasons.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    ranking.push({
      sku,
      name: data.name,
      category: data.category,
      returns: data.returns,
      returnRate: Number((data.returns / records.length * 100).toFixed(1)),
      topReason,
    });
  }

  return ranking.sort((a, b) => b.returns - a.returns);
}

export function computeServiceMetrics(records: ReturnRecord[]): ServiceMetrics {
  const agentMap = new Map<string, { total: number; cases: number }>();

  for (const r of records) {
    if (!agentMap.has(r.agentId)) {
      agentMap.set(r.agentId, { total: 0, cases: 0 });
    }
    const a = agentMap.get(r.agentId)!;
    a.total += r.serviceHandleTime;
    a.cases++;
  }

  const agentRanking = Array.from(agentMap.entries())
    .map(([agentId, data]) => ({
      agentId,
      avgTime: Math.round(data.total / data.cases),
      cases: data.cases,
    }))
    .sort((a, b) => a.avgTime - b.avgTime);

  const times = records.map((r) => r.serviceHandleTime);
  const avgHandleTime = Math.round(times.reduce((s, v) => s + v, 0) / times.length);

  const distBins = [
    { range: "0-15分钟", min: 0, max: 15 },
    { range: "15-30分钟", min: 15, max: 30 },
    { range: "30-60分钟", min: 30, max: 60 },
    { range: "1-2小时", min: 60, max: 120 },
    { range: "2-4小时", min: 120, max: 240 },
    { range: "4小时以上", min: 240, max: Infinity },
  ];

  const distribution = distBins.map((b) => ({
    range: b.range,
    count: times.filter((t) => t >= b.min && t < b.max).length,
  }));

  return {
    avgHandleTime,
    agentRanking,
    distribution,
  };
}

export { getAllRecords };
