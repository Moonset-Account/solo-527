import type { Anomaly } from "~/types";
import { Card } from "./Card";
import clsx from "clsx";

interface AnomalySummaryProps {
  anomalies: Anomaly[];
}

const anomalyIcons: Record<string, string> = {
  low_completion: "📉",
  high_no_show: "🚫",
  high_retake_rate: "🔄",
};

const severityColors: Record<string, string> = {
  high: "bg-red-50 border-red-200 text-red-800",
  medium: "bg-yellow-50 border-yellow-200 text-yellow-800",
  low: "bg-blue-50 border-blue-200 text-blue-800",
};

const typeLabels: Record<string, string> = {
  low_completion: "低完成率",
  high_no_show: "高未签到率",
  high_retake_rate: "高补考率",
};

export function AnomalySummary({ anomalies }: AnomalySummaryProps) {
  const grouped = anomalies.reduce((acc, a) => {
    if (!acc[a.type]) acc[a.type] = [];
    acc[a.type].push(a);
    return acc;
  }, {} as Record<string, Anomaly[]>);

  const totalHigh = anomalies.filter(a => a.severity === "high").length;
  const totalMedium = anomalies.filter(a => a.severity === "medium").length;

  return (
    <Card
      title="异常摘要"
      subtitle={`${totalHigh} 个高危 · ${totalMedium} 个中危 · 共 ${anomalies.length} 个异常`}
    >
      {anomalies.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">✅</div>
          <p>暂无异常数据</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <span className="text-lg">{anomalyIcons[type]}</span>
                <span>{typeLabels[type] || type}</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {items.length}
                </span>
              </div>
              <div className="space-y-1.5 ml-8">
                {items.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    className={clsx(
                      "text-sm px-3 py-2 rounded-md border flex items-center justify-between",
                      severityColors[item.severity]
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.entity_name}</span>
                      {item.course_name && (
                        <span className="text-xs opacity-75">· {item.course_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.value}%</span>
                      <span className="text-xs opacity-75">阈值 {item.threshold}%</span>
                    </div>
                  </div>
                ))}
                {items.length > 3 && (
                  <div className="text-xs text-gray-500 ml-2">还有 {items.length - 3} 个...</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
