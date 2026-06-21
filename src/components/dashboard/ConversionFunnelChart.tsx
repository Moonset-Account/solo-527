"use client";

import {
  FunnelChart,
  Funnel,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { GitBranch } from "lucide-react";

interface FunnelItem {
  name: string;
  value: number;
  rate: number;
}

interface ConversionFunnelChartProps {
  data: FunnelItem[];
}

const funnelColors = [
  { fill: "#2E4F7A", text: "#fff" },
  { fill: "#4D719B", text: "#fff" },
  { fill: "#80A0C6", text: "#fff" },
  { fill: "#B8860B", text: "#fff" },
];

export function ConversionFunnelChart({
  data,
}: ConversionFunnelChartProps) {
  const totalLeads = data[0]?.value ?? 0;

  return (
    <div className="card-gold p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="text-ink-gold-600" size={18} />
          <h3 className="section-title text-base">转化漏斗</h3>
        </div>
        {totalLeads > 0 && (
          <div className="text-right">
            <div className="num text-base font-semibold text-ink-gold-600">
              {data[data.length - 1]?.rate ?? 0}%
            </div>
            <div className="text-xs text-deep-blue-400">整体转化率</div>
          </div>
        )}
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid #D9E3F0",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(30, 58, 95, 0.1)",
              }}
              labelStyle={{ color: "#1E3A5F", fontWeight: 600 }}
              formatter={(value: number, _name: string, props: any) => {
                const item = props.payload;
                return [
                  <div className="flex flex-col gap-1">
                    <span>
                      <span className="font-semibold num">{value}</span> 人
                    </span>
                    <span className="text-deep-blue-500">
                      占比 <span className="num">{item.rate}%</span>
                    </span>
                  </div>,
                  item.name,
                ];
              }}
            />
            <Funnel
              dataKey="value"
              data={data}
              isAnimationActive
              animationDuration={600}
            >
              {data.map((_entry, index) => (
                <rect
                  key={`rect-${index}`}
                  fill={funnelColors[index % funnelColors.length].fill}
                />
              ))}
              <LabelList
                position="center"
                fill="#fff"
                stroke="none"
                dataKey="name"
                fontSize={12}
                fontWeight={600}
              />
              <LabelList
                position="right"
                fill="#4D719B"
                stroke="none"
                dataKey="rate"
                fontSize={11}
                formatter={(val: number) => `${val}%`}
                offset={8}
              />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 pt-3 border-t border-deep-blue-50 grid grid-cols-4 gap-2 text-center">
        {data.map((item, idx) => (
          <div key={item.name} className="flex flex-col items-center">
            <div
              className="w-2.5 h-2.5 rounded-sm mb-1"
              style={{
                backgroundColor: funnelColors[idx % funnelColors.length].fill,
              }}
            />
            <span className="num text-sm font-semibold text-deep-blue-700">
              {item.value}
            </span>
            <span className="text-[10px] text-deep-blue-400">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
