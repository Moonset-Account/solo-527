"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { api } from "@/trpc/react";
import {
  severityConfig,
  statusConfig,
  formatNumber,
  getRelativeTime,
} from "@/utils/format";
import { AnomalyFilterBar } from "@/components/anomalies/AnomalyFilterBar";

const PAGE_SIZE = 8;

interface AnomalyFilterInput {
  status?: ("OPEN" | "INVESTIGATING" | "RESOLVED" | "IGNORED")[];
  severity?: ("LOW" | "MEDIUM" | "HIGH" | "CRITICAL")[];
  metricId?: string;
  startDate?: Date;
  endDate?: Date;
}

function SkeletonCard() {
  return (
    <div className="card block overflow-hidden">
      <div className="flex">
        <div className="w-1.5 rounded-l-xl bg-neutral-200 flex-shrink-0 animate-pulse" />
        <div className="flex-1 p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
              <div className="h-5 w-10 bg-neutral-200 rounded-full animate-pulse" />
            </div>
            <div className="h-5 w-12 bg-neutral-200 rounded-full animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-50 rounded-lg p-2.5">
              <div className="h-3 w-8 bg-neutral-200 rounded mb-1 animate-pulse" />
              <div className="h-5 w-16 bg-neutral-200 rounded animate-pulse" />
            </div>
            <div className="bg-neutral-50 rounded-lg p-2.5">
              <div className="h-3 w-8 bg-neutral-200 rounded mb-1 animate-pulse" />
              <div className="h-5 w-16 bg-neutral-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="h-5 w-20 bg-neutral-200 rounded animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="h-3 w-12 bg-neutral-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-neutral-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnomaliesPage() {
  const [filters, setFilters] = useState<AnomalyFilterInput>({});
  const [page, setPage] = useState(1);

  const { data: listData, isLoading: listLoading } = api.anomaly.list.useQuery(
    {
      ...filters,
      page,
      pageSize: PAGE_SIZE,
    },
  );

  const { data: statsData } = api.anomaly.getStats.useQuery(filters);

  const handleFilterChange = useCallback((newFilters: AnomalyFilterInput) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const totalCount = statsData?.total ?? 0;
  const openCount = statsData?.open ?? 0;
  const criticalCount = statsData?.criticalOrHigh ?? 0;

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const items = listData?.items ?? [];

  const isLoading = listLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">异常中心</h1>
        <p className="text-sm text-neutral-500 mt-1">
          追踪和管理所有销售指标异常
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">
                {isLoading ? (
                  <span className="inline-block h-7 w-8 bg-neutral-200 rounded animate-pulse" />
                ) : (
                  totalCount
                )}
              </p>
              <p className="text-xs text-neutral-500">异常总数</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">
                {isLoading ? (
                  <span className="inline-block h-7 w-8 bg-neutral-200 rounded animate-pulse" />
                ) : (
                  openCount
                )}
              </p>
              <p className="text-xs text-neutral-500">待处理</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">
                {isLoading ? (
                  <span className="inline-block h-7 w-8 bg-neutral-200 rounded animate-pulse" />
                ) : (
                  criticalCount
                )}
              </p>
              <p className="text-xs text-neutral-500">高/严重</p>
            </div>
          </div>
        </div>
      </div>

      <AnomalyFilterBar filters={filters} onChange={handleFilterChange} />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">暂无异常记录</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((anomaly) => {
            const severity =
              severityConfig[
                anomaly.severity as keyof typeof severityConfig
              ];
            const status =
              statusConfig[anomaly.status as keyof typeof statusConfig];
            const isNegative = anomaly.deviationPercentage < 0;

            return (
              <Link
                key={anomaly.id}
                href={`/anomalies/${anomaly.id}`}
                className="card-hoverable block"
              >
                <div className="flex">
                  <div
                    className={`w-1.5 rounded-l-xl ${severity.dot} flex-shrink-0`}
                  />

                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-neutral-800">
                          {anomaly.metric.name}异常
                        </h3>
                        <span
                          className={`badge ${severity.bg} ${severity.color}`}
                        >
                          {severity.label}
                        </span>
                      </div>
                      <span className={`badge ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-neutral-50 rounded-lg p-2.5">
                        <p className="text-xs text-neutral-500 mb-1">
                          实际值
                        </p>
                        <p className="text-sm font-bold font-mono text-neutral-800">
                          {formatNumber(anomaly.actualValue)}
                        </p>
                      </div>
                      <div className="bg-neutral-50 rounded-lg p-2.5">
                        <p className="text-xs text-neutral-500 mb-1">
                          预期值
                        </p>
                        <p className="text-sm font-bold font-mono text-neutral-800">
                          {formatNumber(anomaly.expectedValue)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {isNegative ? (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                        )}
                        <span
                          className={`text-sm font-bold font-mono ${
                            isNegative ? "text-red-600" : "text-emerald-600"
                          }`}
                        >
                          {isNegative ? "" : "+"}
                          {anomaly.deviationPercentage}%
                        </span>
                        <span className="text-xs text-neutral-400">
                          偏离
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-neutral-400">
                        {anomaly.assignedTo && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {anomaly.assignedTo.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getRelativeTime(anomaly.detectedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            共 {totalCount} 条记录，第 {currentPage}/{totalPages} 页
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                disabled={isLoading}
                className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  p === currentPage
                    ? "bg-primary-700 text-white"
                    : "hover:bg-neutral-100 text-neutral-600"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
