import { useMemo } from "react";
import type { AnomalyItem, SummaryStats } from "~/types";
import { formatNumber, getSeverityColor, getSeverityBg } from "~/hooks/useFilterContext";

interface AnomalySummaryProps {
  stats: SummaryStats;
  anomalies: AnomalyItem[];
}

export default function AnomalySummary({ stats, anomalies }: AnomalySummaryProps) {
  const groupedAnomalies = useMemo(() => {
    const groups: Record<string, AnomalyItem[]> = {};
    anomalies.forEach((a) => {
      if (!groups[a.anomalyType]) groups[a.anomalyType] = [];
      groups[a.anomalyType].push(a);
    });
    return groups;
  }, [anomalies]);

  const highSeverityCount = anomalies.filter((a) => a.severity === "高").length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">异常摘要</h2>
            <p className="text-red-100 text-sm mt-1">实时监测灌溉系统异常情况</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{stats.anomalyCount}</div>
            <div className="text-red-100 text-sm">异常总数</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-red-600 font-semibold text-2xl">{highSeverityCount}</div>
            <div className="text-red-500 text-sm">高风险异常</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-orange-600 font-semibold text-2xl">
              {anomalies.filter((a) => a.severity === "中").length}
            </div>
            <div className="text-orange-500 text-sm">中风险异常</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-blue-600 font-semibold text-2xl">
              {stats.postRainRate.toFixed(1)}%
            </div>
            <div className="text-blue-500 text-sm">雨后灌溉占比</div>
          </div>
        </div>

        <h3 className="font-medium text-gray-800 mb-3">异常类型分布</h3>
        <div className="space-y-3 mb-6">
          {Object.entries(groupedAnomalies).map(([type, items]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-gray-600">{getAnomalyTypeName(type)}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                    style={{
                      width: `${Math.min((items.length / anomalies.length) * 100, 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">
                  {items.length}
                </span>
              </div>
            </div>
          ))}
        </div>

        <h3 className="font-medium text-gray-800 mb-3">最新异常</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {anomalies.slice(0, 5).map((anomaly) => (
            <div
              key={anomaly.id}
              className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
              style={{ backgroundColor: getSeverityBg(anomaly.severity) }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: getSeverityColor(anomaly.severity) + "20",
                        color: getSeverityColor(anomaly.severity),
                      }}
                    >
                      {anomaly.severity}
                    </span>
                    <span className="text-sm text-gray-700 font-medium">
                      {anomaly.fieldName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{anomaly.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 {anomaly.suggestion}
                  </p>
                </div>
                {anomaly.isAfterRain && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    🌧️ 雨后
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getAnomalyTypeName(type: string): string {
  const names: Record<string, string> = {
    excessive: "过量灌溉",
    post_rain: "雨后过度灌溉",
    low_efficiency: "泵站效率低下",
  };
  return names[type] || type;
}
