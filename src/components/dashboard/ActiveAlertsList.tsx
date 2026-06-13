"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { severityConfig, statusConfig, getRelativeTime, formatNumber } from "@/utils/format";
import { api } from "@/trpc/react";

export function ActiveAlertsList() {
  const { data, isLoading } = api.anomaly.list.useQuery({
    status: ["OPEN", "INVESTIGATING"],
    page: 1,
    pageSize: 8,
  });

  const activeAnomalies = data?.items ?? [];

  return (
    <div className="card">
      <div className="flex items-center justify-between p-5 border-b border-neutral-100">
        <div>
          <h3 className="text-base font-semibold text-neutral-800">活跃告警</h3>
          <p className="text-sm text-neutral-500 mt-0.5">需要关注的异常</p>
        </div>
        <Link
          href="/anomalies"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          查看全部
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="divide-y divide-neutral-50">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="w-1.5 h-12 rounded-full bg-neutral-100 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-100 animate-pulse rounded w-1/3" />
                <div className="h-3 bg-neutral-100 animate-pulse rounded w-1/2" />
              </div>
            </div>
          ))
        ) : activeAnomalies.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-400">
            暂无活跃告警
          </div>
        ) : (
          activeAnomalies.map((anomaly) => {
            const severity = severityConfig[anomaly.severity as keyof typeof severityConfig];
            const status = statusConfig[anomaly.status as keyof typeof statusConfig];

            return (
              <Link
                key={anomaly.id}
                href={`/anomalies/${anomaly.id}`}
                className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors group"
              >
                <div className={`w-1.5 h-12 rounded-full ${severity.dot} flex-shrink-0`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-neutral-800 truncate group-hover:text-primary-600 transition-colors">
                      {anomaly.metric.name}异常
                    </h4>
                    <span className={`badge ${severity.bg} ${severity.color} flex-shrink-0`}>
                      {severity.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-neutral-500">
                    <span>
                      实际: <span className="font-medium text-neutral-700 font-mono">{formatNumber(anomaly.actualValue)}</span>
                    </span>
                    <span>
                      偏离:{" "}
                      <span className={`font-mono ${anomaly.deviationPercentage > 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {anomaly.deviationPercentage > 0 ? "+" : ""}
                        {anomaly.deviationPercentage}%
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className={`badge ${status.bg} ${status.color}`}>{status.label}</span>
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getRelativeTime(anomaly.detectedAt)}
                    </span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-500 flex-shrink-0 transition-colors" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
