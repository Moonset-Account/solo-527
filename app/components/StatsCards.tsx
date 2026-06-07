import type { SummaryStats } from "~/types";
import { formatNumber } from "~/hooks/useFilterContext";

interface StatsCardsProps {
  stats: SummaryStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "总灌溉水量",
      value: `${formatNumber(stats.totalWater)} m³`,
      icon: "💧",
      color: "from-blue-500 to-cyan-500",
      subText: `共 ${stats.totalIrrigations} 次灌溉`,
    },
    {
      label: "总电费",
      value: `${formatNumber(stats.totalCost)} 元`,
      icon: "⚡",
      color: "from-yellow-500 to-orange-500",
      subText: `覆盖 ${stats.activeFields} 个地块`,
    },
    {
      label: "雨后灌溉量",
      value: `${formatNumber(stats.postRainWater)} m³`,
      icon: "🌧️",
      color: "from-indigo-500 to-purple-500",
      subText: `占比 ${stats.postRainRate.toFixed(1)}%`,
      highlight: stats.postRainRate > 15,
    },
    {
      label: "泵站平均效率",
      value: `${formatNumber(stats.avgPumpEfficiency, 1)}%`,
      icon: "🔧",
      color: stats.avgPumpEfficiency >= 70 ? "from-green-500 to-emerald-500" : "from-red-500 to-pink-500",
      subText: stats.avgPumpEfficiency >= 70 ? "运行良好" : "需关注",
      highlight: stats.avgPumpEfficiency < 70,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative overflow-hidden ${
            card.highlight ? "ring-2 ring-red-200" : ""
          }`}
        >
          <div
            className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color}`}
          />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
              <p
                className={`text-sm mt-2 ${
                  card.highlight ? "text-red-600 font-medium" : "text-gray-500"
                }`}
              >
                {card.subText}
              </p>
            </div>
            <div className="text-3xl">{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
