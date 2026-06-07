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
  AreaChart,
  Area,
  ComposedChart,
  Legend,
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
        total: val.total,
      }))
      .slice(-8);
  }, [orders]);

  return (
    <div className="card p-5">
      <h4 className="text-sm font-semibold text-slate-900 mb-4">{title}</h4>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#94a3b8" unit="%" />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar
              yAxisId="right"
              dataKey="total"
              name="总工单"
              fill="#e2e8f0"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="repeatRate"
              name="复修率"
              stroke="#E63946"
              strokeWidth={2.5}
              dot={{ fill: "#E63946", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface ResponseTimeChartProps {
  orders: WorkOrder[];
  title: string;
}

export function ResponseTimeDistribution({ orders, title }: ResponseTimeChartProps) {
  const data = useMemo(() => {
    const monthly: Record<string, {
      month: string;
      avg: number;
      p50: number;
      p75: number;
      p95: number;
      timeoutRate: number;
    }> = {};

    const validOrders = orders.filter((o) => o.responseTime && !o.isHoliday);

    validOrders.forEach((order) => {
      const month = dayjs(order.createdAt).format("MM月");
      if (!monthly[month]) {
        monthly[month] = { month, avg: 0, p50: 0, p75: 0, p95: 0, timeoutRate: 0 };
      }
    });

    Object.keys(monthly).forEach((month) => {
      const monthOrders = validOrders.filter(
        (o) => dayjs(o.createdAt).format("MM月") === month
      );
      const times = monthOrders.map((o) => o.responseTime!).sort((a, b) => a - b);

      if (times.length > 0) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const p50 = times[Math.floor(times.length * 0.5)] || 0;
        const p75 = times[Math.floor(times.length * 0.75)] || 0;
        const p95 = times[Math.floor(times.length * 0.95)] || 0;
        const timeoutCount = times.filter((t) => t > 120).length;
        const timeoutRate = (timeoutCount / times.length) * 100;

        monthly[month] = {
          month,
          avg: Math.round(avg),
          p50: Math.round(p50),
          p75: Math.round(p75),
          p95: Math.round(p95),
          timeoutRate: Math.round(timeoutRate * 10) / 10,
        };
      }
    });

    return Object.values(monthly).slice(-6);
  }, [orders]);

  return (
    <div className="card p-5">
      <h4 className="text-sm font-semibold text-slate-900 mb-4">{title}</h4>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Line
              type="monotone"
              dataKey="avg"
              name="平均"
              stroke="#0F2B4A"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="p75"
              name="P75"
              stroke="#2A9D8F"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="p95"
              name="P95"
              stroke="#E63946"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        响应时长分位数统计（排除节假日工单）
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
            <Bar dataKey="count" name="工单数" radius={[0, 6, 6, 0]}>
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
                style={{ width: `${data[0] ? (item.cost / data[0].cost) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-700 w-16 text-right">
              ¥{item.cost}
            </span>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">暂无材料消耗数据</p>
        )}
      </div>
    </div>
  );
}
