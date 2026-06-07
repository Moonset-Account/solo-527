import type { FunnelMetrics } from "~/types";
import { Card } from "./Card";
import {
  Funnel,
  FunnelChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface CompletionFunnelProps {
  data: FunnelMetrics;
}

export function CompletionFunnel({ data }: CompletionFunnelProps) {
  const funnelData = [
    { name: "报名", value: data.total_enrollments, fill: "#3b82f6" },
    { name: "签到", value: data.checked_in, fill: "#60a5fa" },
    { name: "完成课程", value: data.completed_course, fill: "#34d399" },
    { name: "首次通过测验", value: data.quiz_first_pass, fill: "#10b981" },
    { name: "补考通过", value: data.quiz_retake_pass, fill: "#f59e0b" },
    { name: "获得证书", value: data.certificates_issued, fill: "#8b5cf6" },
  ];

  const stats = [
    { label: "签到率", value: `${data.checkin_rate}%`, color: "text-blue-600" },
    { label: "课程完成率", value: `${data.completion_rate}%`, color: "text-green-600" },
    { label: "首次通过率", value: `${data.first_pass_rate}%`, color: "text-emerald-600" },
    { label: "补考通过率", value: `${data.retake_pass_rate}%`, color: "text-amber-600" },
    { label: "证书获得率", value: `${data.certificate_rate}%`, color: "text-purple-600" },
  ];

  return (
    <Card title="完成率漏斗" subtitle="从报名到获得证书的转化路径">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.value} 人</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Funnel dataKey="value" data={funnelData} isAnimationActive>
              <LabelList
                position="right"
                fill="#374151"
                stroke="none"
                dataKey="name"
                fontSize={12}
              />
              <LabelList
                position="center"
                fill="#fff"
                stroke="none"
                dataKey="value"
                fontSize={12}
                fontWeight={600}
              />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-5 gap-2 mt-4 pt-4 border-t border-gray-100">
        {stats.map(s => (
          <div key={s.label} className="text-center">
            <p className={`text-lg font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
        <span className="font-medium text-gray-600">说明：</span>
        补考通过仅统计首次未通过、后续通过的学员；总通过含首次+补考
      </div>
    </Card>
  );
}
