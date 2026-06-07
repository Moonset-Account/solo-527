import { useState, useEffect } from "react";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import FilterBar from "~/components/FilterBar";
import StatsCards from "~/components/StatsCards";
import AnomalySummary from "~/components/AnomalySummary";
import WaterTrendChart from "~/components/WaterTrendChart";
import MoistureComparisonChart from "~/components/MoistureComparisonChart";
import PumpEnergyChart from "~/components/PumpEnergyChart";
import StrategyBenefitsChart from "~/components/StrategyBenefitsChart";
import { useFilterContext, buildQueryString } from "~/hooks/useFilterContext";
import type {
  FilterOptions,
  SummaryStats,
  AnomalyItem,
  WaterTrendItem,
  MoistureItem,
  PumpEnergyItem,
  StrategyBenefitItem,
} from "~/types";

export const meta: MetaFunction = () => {
  return [
    { title: "农田灌溉用水效率分析 | 农业合作社" },
    { name: "description", content: "农业灌溉用水效率分析仪表盘" },
  ];
};

interface LoaderData {
  mockData: {
    filterOptions: FilterOptions;
    summary: SummaryStats;
    anomalies: AnomalyItem[];
    waterTrend: WaterTrendItem[];
    moistureData: MoistureItem[];
    pumpEnergy: PumpEnergyItem[];
    strategyBenefits: StrategyBenefitItem[];
  };
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const queryString = url.searchParams.toString();

  let filterOptions: FilterOptions = {
    fields: [
      { id: 1, name: "东一号田", area: 120 },
      { id: 2, name: "东二号田", area: 95 },
      { id: 3, name: "西一号田", area: 150 },
      { id: 4, name: "西二号田", area: 110 },
      { id: 5, name: "南一号田", area: 80 },
      { id: 6, name: "北一号田", area: 130 },
    ],
    crops: [
      { id: 1, name: "冬小麦", waterRequirement: 4.5 },
      { id: 2, name: "夏玉米", waterRequirement: 5.2 },
      { id: 3, name: "大豆", waterRequirement: 3.8 },
      { id: 4, name: "棉花", waterRequirement: 3.2 },
    ],
    pumps: [
      { id: 1, name: "1号泵站", ratedFlow: 200 },
      { id: 2, name: "2号泵站", ratedFlow: 160 },
      { id: 3, name: "3号泵站", ratedFlow: 100 },
    ],
    strategies: [
      { id: 1, name: "传统漫灌", strategyType: "traditional" },
      { id: 2, name: "喷灌", strategyType: "sprinkler" },
      { id: 3, name: "滴灌", strategyType: "drip" },
      { id: 4, name: "智能灌溉", strategyType: "smart" },
    ],
  };

  let summary: SummaryStats = {
    totalIrrigations: 186,
    totalWater: 28450.5,
    totalCost: 12456.8,
    postRainWater: 4268.3,
    activeFields: 6,
    avgPumpEfficiency: 72.5,
    anomalyCount: 12,
    postRainRate: 15.0,
  };

  let anomalies: AnomalyItem[] = generateMockAnomalies();
  let waterTrend: WaterTrendItem[] = generateMockWaterTrend();
  let moistureData: MoistureItem[] = generateMockMoistureData();
  let pumpEnergy: PumpEnergyItem[] = generateMockPumpEnergy();
  let strategyBenefits: StrategyBenefitItem[] = generateMockStrategyBenefits();

  try {
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

    const [
      filterRes,
      summaryRes,
      anomalyRes,
      waterRes,
      moistureRes,
      pumpRes,
      strategyRes,
    ] = await Promise.allSettled([
      fetch(`${baseUrl}/api/filters`).then((r) => r.json()),
      fetch(`${baseUrl}/api/summary?${queryString}`).then((r) => r.json()),
      fetch(`${baseUrl}/api/anomalies?${queryString}`).then((r) => r.json()),
      fetch(`${baseUrl}/api/water-trend?${queryString}`).then((r) => r.json()),
      fetch(`${baseUrl}/api/moisture-comparison?${queryString}`).then((r) => r.json()),
      fetch(`${baseUrl}/api/pump-energy?${queryString}`).then((r) => r.json()),
      fetch(`${baseUrl}/api/strategy-benefits?${queryString}`).then((r) => r.json()),
    ]);

    if (filterRes.status === "fulfilled") filterOptions = filterRes.value;
    if (summaryRes.status === "fulfilled") summary = summaryRes.value;
    if (anomalyRes.status === "fulfilled") anomalies = anomalyRes.value;
    if (waterRes.status === "fulfilled") waterTrend = waterRes.value;
    if (moistureRes.status === "fulfilled") moistureData = moistureRes.value;
    if (pumpRes.status === "fulfilled") pumpEnergy = pumpRes.value;
    if (strategyRes.status === "fulfilled") strategyBenefits = strategyRes.value;
  } catch (err) {
    console.log("使用模拟数据:", err);
  }

  return json({
    mockData: {
      filterOptions,
      summary,
      anomalies,
      waterTrend,
      moistureData,
      pumpEnergy,
      strategyBenefits,
    },
  });
};

export default function Dashboard() {
  const { mockData } = useLoaderData<LoaderData>();
  const [filters, setFilters] = useFilterContext();
  const revalidator = useRevalidator();
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (revalidator.state === "idle") {
      const timer = setTimeout(() => {
        revalidator.revalidate();
      }, 300000);
      return () => clearTimeout(timer);
    }
  }, [revalidator]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "water_summary", filters }),
      });
      const data = await res.json();
      alert(`导出任务已创建: ${data.taskId}`);
    } catch (err) {
      alert("导出功能需要后端数据库支持");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xl">
                🌾
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">灌溉用水效率分析</h1>
                <p className="text-xs text-gray-500">农业合作社 · 技术员工作台</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isExporting ? "导出中..." : "📊 导出数据"}
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                技
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <FilterBar
          options={mockData.filterOptions}
          filters={filters}
          onFilterChange={setFilters}
        />

        <StatsCards stats={mockData.summary} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-1">
            <AnomalySummary
              stats={mockData.summary}
              anomalies={mockData.anomalies}
            />
          </div>
          <div className="lg:col-span-2">
            <WaterTrendChart data={mockData.waterTrend} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <MoistureComparisonChart data={mockData.moistureData} />
          <PumpEnergyChart data={mockData.pumpEnergy} />
        </div>

        <div className="mt-6 mb-8">
          <StrategyBenefitsChart data={mockData.strategyBenefits} />
        </div>

        <footer className="text-center py-6 text-sm text-gray-400 border-t border-gray-200">
          <p>Remix + Express + Redis + PostgreSQL · 灌溉效率分析系统 v1.0</p>
          <p className="mt-1">数据每5分钟自动刷新 · 筛选条件已保存在URL中</p>
        </footer>
      </main>

      <style>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
      `}</style>
    </div>
  );
}

function generateMockAnomalies(): AnomalyItem[] {
  return [
    {
      id: 1,
      fieldName: "东二号田",
      cropName: "夏玉米",
      pumpName: "2号泵站",
      strategyName: "传统漫灌",
      startTime: "2025-06-05T10:30:00",
      waterVolume: 280.5,
      isAfterRain: true,
      rainAmount24h: 15.2,
      flowRate: 85.2,
      ratedFlow: 160,
      area: 95,
      anomalyType: "post_rain",
      severity: "高",
      description: "降雨15.2mm后仍灌溉280.5m³",
      suggestion: "启用降雨联动控制，雨后自动减少灌溉量",
    },
    {
      id: 2,
      fieldName: "西一号田",
      cropName: "冬小麦",
      pumpName: "1号泵站",
      strategyName: "传统漫灌",
      startTime: "2025-06-04T08:00:00",
      waterVolume: 520.0,
      isAfterRain: false,
      rainAmount24h: 0,
      flowRate: 130.0,
      ratedFlow: 200,
      area: 150,
      anomalyType: "excessive",
      severity: "高",
      description: "灌溉水量520m³超过作物需求1.8倍",
      suggestion: "检查土壤湿度传感器，考虑缩短灌溉时长",
    },
    {
      id: 3,
      fieldName: "南一号田",
      cropName: "棉花",
      pumpName: "3号泵站",
      strategyName: "喷灌",
      startTime: "2025-06-03T14:00:00",
      waterVolume: 120.0,
      isAfterRain: false,
      rainAmount24h: 0,
      flowRate: 58.0,
      ratedFlow: 100,
      area: 80,
      anomalyType: "low_efficiency",
      severity: "中",
      description: "泵站效率仅58.0%",
      suggestion: "检查水泵叶轮、管道是否堵塞，检查供电电压",
    },
    {
      id: 4,
      fieldName: "北一号田",
      cropName: "夏玉米",
      pumpName: "1号泵站",
      strategyName: "传统漫灌",
      startTime: "2025-06-02T09:00:00",
      waterVolume: 410.0,
      isAfterRain: false,
      rainAmount24h: 0,
      flowRate: 145.0,
      ratedFlow: 200,
      area: 130,
      anomalyType: "excessive",
      severity: "中",
      description: "灌溉水量410m³超过作物需求1.5倍",
      suggestion: "检查土壤湿度传感器，考虑缩短灌溉时长",
    },
    {
      id: 5,
      fieldName: "东一号田",
      cropName: "冬小麦",
      pumpName: "2号泵站",
      strategyName: "喷灌",
      startTime: "2025-06-01T16:00:00",
      waterVolume: 195.0,
      isAfterRain: false,
      rainAmount24h: 0,
      flowRate: 105.0,
      ratedFlow: 160,
      area: 120,
      anomalyType: "low_efficiency",
      severity: "中",
      description: "泵站效率仅65.6%",
      suggestion: "检查水泵叶轮、管道是否堵塞，检查供电电压",
    },
  ];
}

function generateMockWaterTrend(): WaterTrendItem[] {
  const data: WaterTrendItem[] = [];
  const start = new Date("2025-05-15");
  const fieldNames = ["东一号田", "东二号田", "西一号田", "西二号田", "南一号田", "北一号田"];

  for (let i = 0; i < 23; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const isRainy = [2, 5, 9, 14, 18].includes(i);
    const rainfall = isRainy ? Math.random() * 25 + 8 : Math.random() * 3;
    const baseWater = 800 + Math.random() * 600;
    const postRainWater = isRainy ? baseWater * 0.25 : 0;

    data.push({
      date: dateStr,
      totalWater: baseWater,
      postRainWater: postRainWater,
      normalWater: baseWater - postRainWater,
      irrigationCount: Math.floor(Math.random() * 6) + 3,
      totalCost: baseWater * 0.42,
      rainfall: rainfall,
      hasRain: isRainy,
    });
  }

  return data;
}

function generateMockMoistureData(): MoistureItem[] {
  const data: MoistureItem[] = [];
  const start = new Date("2025-05-20");
  const fields = [
    { id: 1, name: "东一号田", crop: "冬小麦", area: 120 },
    { id: 2, name: "东二号田", crop: "夏玉米", area: 95 },
    { id: 3, name: "西一号田", crop: "冬小麦", area: 150 },
    { id: 4, name: "西二号田", crop: "大豆", area: 110 },
    { id: 5, name: "南一号田", crop: "棉花", area: 80 },
    { id: 6, name: "北一号田", crop: "夏玉米", area: 130 },
  ];

  for (let i = 0; i < 18; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    fields.forEach((field, idx) => {
      const baseMoisture = 62 + idx * 3 + Math.sin(i / 3) * 8;
      data.push({
        fieldId: field.id,
        fieldName: field.name,
        cropName: field.crop,
        date: dateStr,
        avgMoisture: Math.min(Math.max(baseMoisture + (Math.random() - 0.5) * 5, 45), 88),
        minMoisture: Math.min(Math.max(baseMoisture - 8 + (Math.random() - 0.5) * 3, 40), 80),
        maxMoisture: Math.min(Math.max(baseMoisture + 8 + (Math.random() - 0.5) * 3, 55), 92),
        fieldArea: field.area,
      });
    });
  }

  return data;
}

function generateMockPumpEnergy(): PumpEnergyItem[] {
  const data: PumpEnergyItem[] = [];
  const start = new Date("2025-05-20");
  const pumps = [
    { id: 1, name: "1号泵站", ratedFlow: 200, powerRating: 55 },
    { id: 2, name: "2号泵站", ratedFlow: 160, powerRating: 37 },
    { id: 3, name: "3号泵站", ratedFlow: 100, powerRating: 22 },
  ];

  for (let i = 0; i < 18; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    pumps.forEach((pump, idx) => {
      const hours = 2 + Math.random() * 5;
      const efficiencyFactor = 0.65 + Math.random() * 0.25;
      const totalWater = pump.ratedFlow * efficiencyFactor * hours;

      data.push({
        pumpId: pump.id,
        pumpName: pump.name,
        ratedFlow: pump.ratedFlow,
        powerRating: pump.powerRating,
        date: dateStr,
        totalWater: totalWater,
        totalElectricity: pump.powerRating * hours,
        totalCost: pump.powerRating * hours * 0.65,
        avgFlow: pump.ratedFlow * efficiencyFactor,
        runCount: Math.floor(Math.random() * 3) + 1,
        runHours: hours,
        efficiency: efficiencyFactor * 100,
        unitWaterCost: (pump.powerRating * hours * 0.65) / totalWater,
      });
    });
  }

  return data;
}

function generateMockStrategyBenefits(): StrategyBenefitItem[] {
  return [
    {
      strategyId: 1,
      strategyName: "传统漫灌",
      strategyType: "traditional",
      cropName: "冬小麦",
      fieldName: "西一号田",
      applicationCount: 45,
      totalWater: 8500,
      totalCost: 3825,
      avgFieldArea: 135,
      waterPerField: 212.5,
      waterPerMu: 8.2,
      waterSavingRate: 0,
    },
    {
      strategyId: 2,
      strategyName: "喷灌",
      strategyType: "sprinkler",
      cropName: "冬小麦",
      fieldName: "东一号田",
      applicationCount: 38,
      totalWater: 5890,
      totalCost: 2650.5,
      avgFieldArea: 120,
      waterPerField: 155,
      waterPerMu: 6.2,
      waterSavingRate: 24.4,
    },
    {
      strategyId: 3,
      strategyName: "滴灌",
      strategyType: "drip",
      cropName: "棉花",
      fieldName: "南一号田",
      applicationCount: 52,
      totalWater: 3120,
      totalCost: 1404,
      avgFieldArea: 80,
      waterPerField: 60,
      waterPerMu: 4.5,
      waterSavingRate: 45.1,
    },
    {
      strategyId: 4,
      strategyName: "智能灌溉",
      strategyType: "smart",
      cropName: "夏玉米",
      fieldName: "东二号田",
      applicationCount: 42,
      totalWater: 3654,
      totalCost: 1644.3,
      avgFieldArea: 95,
      waterPerField: 87,
      waterPerMu: 4.3,
      waterSavingRate: 47.6,
    },
  ];
}
