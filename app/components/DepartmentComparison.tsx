import type { DepartmentMetric } from "~/types";
import { Card } from "./Card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DepartmentComparisonProps {
  data: DepartmentMetric[];
}

export function DepartmentComparison({ data }: DepartmentComparisonProps) {
  const chartData = data.map(d => ({
    name: d.department_name.length > 4 ? d.department_name.slice(0, 4) : d.department_name,
    fullName: d.department_name,
    完成率: d.completion_rate,
    首次通过率: d.first_pass_rate,
    证书率: d.certificate_rate,
    报名人数: d.total_enrollments,
  }));

  return (
    <Card title="部门完成率对比" subtitle={`共 ${data.length} 个部门`}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2">
                      <p className="font-medium text-gray-900 mb-1">{item.fullName}</p>
                      {payload.map((p: any) => (
                        <p key={p.dataKey} className="text-sm text-gray-600">
                          <span style={{ color: p.color }}>●</span> {p.dataKey}: {p.value}%
                        </p>
                      ))}
                      <p className="text-xs text-gray-500 mt-1">报名人数: {item.报名人数}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="完成率" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="首次通过率" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="证书率" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-2 text-gray-600 font-medium">部门</th>
              <th className="text-right py-2 px-2 text-gray-600 font-medium">报名</th>
              <th className="text-right py-2 px-2 text-gray-600 font-medium">完成率</th>
              <th className="text-right py-2 px-2 text-gray-600 font-medium">首次通过率</th>
              <th className="text-right py-2 px-2 text-gray-600 font-medium">证书率</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 5).map(d => (
              <tr key={d.department_id} className="border-b border-gray-50">
                <td className="py-2 px-2 font-medium text-gray-900">{d.department_name}</td>
                <td className="text-right py-2 px-2 text-gray-600">{d.total_enrollments}</td>
                <td className="text-right py-2 px-2">
                  <span className="text-blue-600 font-medium">{d.completion_rate}%</span>
                </td>
                <td className="text-right py-2 px-2">
                  <span className="text-green-600 font-medium">{d.first_pass_rate}%</span>
                </td>
                <td className="text-right py-2 px-2">
                  <span className="text-purple-600 font-medium">{d.certificate_rate}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
