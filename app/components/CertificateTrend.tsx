import type { CertificateTrendItem } from "~/types";
import { Card } from "./Card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dayjs from "dayjs";

interface CertificateTrendProps {
  data: CertificateTrendItem[];
}

export function CertificateTrend({ data }: CertificateTrendProps) {
  const chartData = data.map(d => ({
    date: dayjs(d.issue_date).format("MM-DD"),
    fullDate: d.issue_date,
    首次通过: d.first_pass_count,
    补考通过: d.retake_pass_count,
    总数: d.count,
  }));

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const firstPassTotal = data.reduce((sum, d) => sum + d.first_pass_count, 0);
  const retakeTotal = data.reduce((sum, d) => sum + d.retake_pass_count, 0);

  return (
    <Card title="证书发放趋势" subtitle={`共发放 ${total} 张证书 · 首次通过 ${firstPassTotal} · 补考通过 ${retakeTotal}`}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorFirst" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRetake" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2">
                      <p className="font-medium text-gray-900 mb-1">{item.fullDate}</p>
                      {payload.map((p: any) => (
                        <p key={p.dataKey} className="text-sm text-gray-600">
                          <span style={{ color: p.color }}>●</span> {p.dataKey}: {p.value} 张
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
            <Area
              type="monotone"
              dataKey="首次通过"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorFirst)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="补考通过"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRetake)"
              stackId="1"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{total}</p>
          <p className="text-xs text-gray-500 mt-0.5">总发放数</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{firstPassTotal}</p>
          <p className="text-xs text-gray-500 mt-0.5">首次通过获得</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600">{retakeTotal}</p>
          <p className="text-xs text-gray-500 mt-0.5">补考通过获得</p>
        </div>
      </div>
    </Card>
  );
}
