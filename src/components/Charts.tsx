"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  BoxPlot,
  Scatter,
  ZAxis,
} from "recharts";
import { WorkOrder } from "@/types";
import dayjs from "dayjs";

interface TrendChartProps {
  orders: WorkOrder[];
  title: string;
}

export function RepeatRateTrend({ orders, title }: TrendChartProps) {
  const data = useMemo(() => {
    const weekly: Record<string, { total: number; repeat: number }> = {};

    orders.forEach((order) => {
      const week = dayjs(order.createdAt).format("MM/DD");
      if (!weekly[week]) {
        weekly[week] = { total: 0, repeat: 0 };
      }
      weekly[week].total++;
      if (order.isRepeat) weekly[week].repeat++;
    });

    return Object.entries(weekly)
      .map(([date, val]) => ({
        date,
        repeatRate: val.total > 0 ? Math.round((val.repeat / val.total) * 1000) / 10 : 0,
      }))
      .slice(-8);
  }, [orders]);

  return (
    <div className="card p-5">
      <h4 className="text-sm font-semibold text-slate-900 mb-4">{title}</h4>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" unit="%" />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
              formatter={(value: number) => [`${value}%`, "复修率"]}
            />
            <Line
              type="monotone"
              dataKey="repeatRate"
              stroke="#E63946"
              strokeWidth={2.5}
              dot={{ fill: "#E63946", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface ResponseTimeBoxplotProps {
  orders: WorkOrder[];
  title: string;
}

export function ResponseTimeBoxplot({ orders, title }: ResponseTimeBoxplotProps) {
  const data = useMemo(() => {
    const monthly: Record<string, number[]> = {};

    orders
      .filter((o) => o.responseTime && !o.isHoliday)
      .forEach((order) => {
        const month = dayjs(order.createdAt).format("MM月");
        if (!monthly[month]) monthly[month] = [];
        monthly[month].push(order.responseTime!);
      });

    const calculateStats = (values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const median = sorted[Math.floor(sorted.length * 0.5)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      return { min, q1, median, q3, max };
    };

    return Object.entries(monthly)
      .map(([month, times]) => ({
        month,
        ...calculateStats(times),
      }))
      .slice(-6);
  }, [orders]);

  return (
    <div className="card p-5">
      <h4 className="text-sm font-semibold text-slate-900 mb-4">{title}</h4>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BoxPlot data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" unit="分" />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
            />
          </BoxPlot>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        箱线图展示响应时长分布（排除节假日工单）
      </p>
    </div>
  );
}

interface RepairTypeChartProps {
  orders: WorkOrder[];
  title: string;
}

const COLORS = ["#0F2B4A", "#2A9D8F", "#F4A261", "#E63946", "#E9C46A", "#8DADD2", "#4D77A8"];

export function RepairTypeDistribution({ orders, title }: RepairTypeChartProps) {
  const data = useMemo(() => {
    const typeCount: Record<string, number> = {};
    orders.forEach((order) => {
      typeCount[order.repairType] = (typeCount[order.repairType] || 0) + 1;
    });
    return Object.entries(typeCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [orders]);

  return (
    <div className="card p-5">
      <h4 className="text-sm font-semibold text-slate-900 mb-4">{title}</h4>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              stroke="#94a3b8"
              width={70}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface MaterialsChartProps {
  orders: WorkOrder[];
  title: string;
}

export function MaterialsUsage({ orders, title }: MaterialsChartProps) {
  const data = useMemo(() => {
    const materialUsage: Record<string, { quantity: number; cost: number }> = {};

    orders.forEach((order) => {
      order.materials.forEach((mat) => {
        if (!materialUsage[mat.name]) {
          materialUsage[mat.name] = { quantity: 0, cost: 0 };
        }
        materialUsage[mat.name].quantity += mat.quantity;
        materialUsage[mat.name].cost += mat.quantity * mat.price;
      });
    });

    return Object.entries(materialUsage)
      .map(([name, val]) => ({
        name,
        quantity: val.quantity,
        cost: Math.round(val.cost),
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 8);
  }, [orders]);

  return (
    <div className="card p-5">
      <h4 className="text-sm font-semibold text-slate-900 mb-4">{title}</h4>
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-20 truncate">
              {item.name}
            </span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
                style={{ width: `${(item.quantity / data[0].quantity) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-700 w-16 text-right">
              ¥{item.cost}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
