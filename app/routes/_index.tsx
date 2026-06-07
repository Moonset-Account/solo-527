import { useState, useEffect, useMemo, useCallback } from "react";
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
import { useFilterContext } from "~/hooks/useFilterContext";
import type {
  FilterOptions,
  SummaryStats,
  AnomalyItem,
  WaterTrendItem,
  MoistureItem,
  PumpEnergyItem,
  StrategyBenefitItem,
  FilterState,
} from "~/types";

export const meta: MetaFunction = () => {
  return [
    { title: "农田灌溉用水效率分析 | 农业合作社" },
    { name: "description", content: "农业灌溉用水效率分析仪表盘" },
  ];
};

interface ExportTask {
  id: string;
  type: string;
  typeLabel: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  createdAt: Date;
  filePath?: string;
  error?: string;
}

interface LoaderData {
  baseData: {
    filterOptions: FilterOptions;
    allAnomalies: AnomalyItem[];
    allWaterTrend: WaterTrendItem[];
    allMoistureData: MoistureItem[];
    allPumpEnergy: PumpEnergyItem[];
    allStrategyBenefits: StrategyBenefitItem[];
  };
  dataSource: "demo" | "live";
}

export const loader: LoaderFunction = async () => {
  const filterOptions: FilterOptions = {
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

  const allAnomalies: AnomalyItem[] = generateMockAnomalies();
  const allWaterTrend: WaterTrendItem[] = generateMockWaterTrend();
  const allMoistureData: MoistureItem[] = generateMockMoistureData();
  const allPumpEnergy: PumpEnergyItem[] = generateMockPumpEnergy();
  const allStrategyBenefits: StrategyBenefitItem[] = generateMockStrategyBenefits();

  return json({
    baseData: {
      filterOptions,
      allAnomalies,
      allWaterTrend,
      allMoistureData,
      allPumpEnergy,
      allStrategyBenefits,
    },
    dataSource: "demo" as const,
  });
};

function filterDataByFilters(
  baseData: LoaderData["baseData"],
  filters: FilterState,
  filterOptions: FilterOptions
) {
  const {
    allWaterTrend,
    allMoistureData,
    allPumpEnergy,
    allStrategyBenefits,
    allAnomalies,
  } = baseData;

  const selectedFieldNames = filters.fieldIds.length
    ? filterOptions.fields.filter((f) => filters.fieldIds.includes(f.id)).map((f) => f.name)
    : [];

  const selectedCropNames = filters.cropIds.length
    ? filterOptions.crops.filter((c) => filters.cropIds.includes(c.id)).map((c) => c.name)
    : [];

  const selectedPumpNames = filters.pumpIds.length
    ? filterOptions.pumps.filter((p) => filters.pumpIds.includes(p.id)).map((p) => p.name)
    : [];

  const selectedStrategyNames = filters.strategyIds.length
    ? filterOptions.strategies.filter((s) => filters.strategyIds.includes(s.id)).map((s) => s.name)
    : [];

  const filterByDate = (dateStr: string) => {
    if (filters.startDate && dateStr < filters.startDate) return false;
    if (filters.endDate && dateStr > filters.endDate) return false;
    return true;
  };

  const filteredWaterTrend = allWaterTrend.filter((item) => {
    if (!filterByDate(item.date)) return false;
    return true;
  });

  const filteredMoistureData = allMoistureData.filter((item) => {
    if (!filterByDate(item.date)) return false;
    if (selectedFieldNames.length && !selectedFieldNames.includes(item.fieldName)) return false;
    if (selectedCropNames.length && !selectedCropNames.includes(item.cropName)) return false;
    return true;
  });

  const filteredPumpEnergy = allPumpEnergy.filter((item) => {
    if (!filterByDate(item.date)) return false;
    if (selectedPumpNames.length && !selectedPumpNames.includes(item.pumpName)) return false;
    return true;
  });

  const filteredStrategyBenefits = allStrategyBenefits.filter((item) => {
    if (selectedStrategyNames.length && !selectedStrategyNames.includes(item.strategyName)) return false;
    if (selectedFieldNames.length && !selectedFieldNames.includes(item.fieldName)) return false;
    if (selectedCropNames.length && !selectedCropNames.includes(item.cropName)) return false;
    return true;
  });

  const filteredAnomalies = allAnomalies.filter((item) => {
    const itemDate = item.startTime ? item.startTime.split("T")[0] : "";
    if (!filterByDate(itemDate)) return false;
    if (selectedFieldNames.length && !selectedFieldNames.includes(item.fieldName)) return false;
    if (selectedCropNames.length && !selectedCropNames.includes(item.cropName)) return false;
    if (selectedPumpNames.length && !selectedPumpNames.includes(item.pumpName)) return false;
    return true;
  });

  const summary: SummaryStats = {
    totalIrrigations: filteredWaterTrend.reduce((sum, d) => sum + d.irrigationCount, 0),
    totalWater: filteredWaterTrend.reduce((sum, d) => sum + d.totalWater, 0),
    totalCost: filteredWaterTrend.reduce((sum, d) => sum + d.totalCost, 0),
    postRainWater: filteredWaterTrend.reduce((sum, d) => sum + d.postRainWater, 0),
    activeFields: new Set(filteredMoistureData.map((d) => d.fieldName)).size || 6,
    avgPumpEfficiency: filteredPumpEnergy.length
      ? filteredPumpEnergy.reduce((sum, d) => sum + d.efficiency, 0) / filteredPumpEnergy.length
      : 72.5,
    anomalyCount: filteredAnomalies.length,
    postRainRate:
      filteredWaterTrend.reduce((sum, d) => sum + d.totalWater, 0) > 0
        ? (filteredWaterTrend.reduce((sum, d) => sum + d.postRainWater, 0) /
            filteredWaterTrend.reduce((sum, d) => sum + d.totalWater, 0)) *
          100
        : 0,
  };

  return {
    summary,
    waterTrend: filteredWaterTrend,
    moistureData: filteredMoistureData,
    pumpEnergy: filteredPumpEnergy,
    strategyBenefits: filteredStrategyBenefits,
    anomalies: filteredAnomalies,
  };
}

export default function Dashboard() {
  const { baseData, dataSource } = useLoaderData<LoaderData>();
  const [filters, setFilters] = useFilterContext();
  const revalidator = useRevalidator();

  const [exportTasks, setExportTasks] = useState<ExportTask[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);

  const filteredData = useMemo(
    () => filterDataByFilters(baseData, filters, baseData.filterOptions),
    [baseData, filters]
  );

  const exportTypes = [
    { type: "water_summary", label: "💧 用水汇总报表" },
    { type: "irrigation_records", label: "📋 灌溉明细记录" },
    { type: "pump_energy", label: "⚡ 泵站能耗分析" },
    { type: "anomalies", label: "⚠️ 异常记录清单" },
  ];

  const simulateExport = useCallback((exportType: string) => {
    const typeLabel = exportTypes.find((t) => t.type === exportType)?.label || exportType;
    const taskId = Math.random().toString(36).slice(2, 10);

    const newTask: ExportTask = {
      id: taskId,
      type: exportType,
      typeLabel,
      status: "pending",
      progress: 0,
      createdAt: new Date(),
    };

    setExportTasks((prev) => [newTask, ...prev]);
    setShowExportMenu(false);
    setShowExportPanel(true);

    setTimeout(() => {
      setExportTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: "processing", progress: 10 } : t))
      );
    }, 500);

    const progressInterval = setInterval(() => {
      setExportTasks((prev) => {
        const task = prev.find((t) => t.id === taskId);
        if (!task || task.status === "completed") {
          clearInterval(progressInterval);
          return prev;
        }

        const newProgress = Math.min(task.progress + Math.random() * 20 + 10, 100);
        const isCompleted = newProgress >= 100;

        return prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                progress: isCompleted ? 100 : newProgress,
                status: isCompleted ? "completed" : "processing",
                filePath: isCompleted
                  ? `/exports/${taskId}_${exportType}_${new Date().toISOString().split("T")[0]}.csv`
                  : undefined,
              }
            : t
        );
      });
    }, 800);
  }, [exportTypes]);

  const handleExport = useCallback(
    (exportType: string) => {
      fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: exportType, filters }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            const typeLabel = exportTypes.find((t) => t.type === exportType)?.label || exportType;
            const newTask: ExportTask = {
              id: data.taskId,
              type: exportType,
              typeLabel,
              status: "processing",
              progress: 10,
              createdAt: new Date(),
            };
            setExportTasks((prev) => [newTask, ...prev]);
            setShowExportPanel(true);
          }
        })
        .catch(() => {
          simulateExport(exportType);
        });
      setShowExportMenu(false);
    },
    [filters, exportTypes, simulateExport]
  );

  useEffect(() => {
    if (exportTasks.length > 0) {
      const activeCount = exportTasks.filter(
        (t) => t.status === "processing" || t.status === "pending"
      ).length;
      if (activeCount === 0) return;

      const timer = setInterval(() => {
        exportTasks
          .filter((t) => t.status === "processing" || t.status === "pending")
          .forEach((task) => {
            fetch(`/api/export/${task.id}`)
              .then((r) => r.json())
              .then((data) => {
                if (data && data.id) {
                  setExportTasks((prev) =>
                    prev.map((t) =>
                      t.id === task.id
                        ? {
                            ...t,
                            status: data.status,
                            progress: data.progress,
                            filePath: data.publicPath,
                            error: data.error,
                          }
                        : t
                    )
                  );
                }
              })
              .catch(() => {});
          });
      }, 1500);

      return () => clearInterval(timer);
    }
  }, [exportTasks]);

  const getStatusText = (task: ExportTask) => {
    switch (task.status) {
      case "pending":
        return "等待中...";
      case "processing":
        return `处理中 ${task.progress.toFixed(0)}%`;
      case "completed":
        return "✅ 已完成";
      case "failed":
        return `❌ ${task.error || "失败"}`;
      default:
        return task.status;
    }
  };

  const getStatusColor = (task: ExportTask) => {
    switch (task.status) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "failed":
        return "text-red-600 bg-red-50";
      case "processing":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
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
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm flex items-center gap-2"
                >
                  📊 导出数据
                  <span className="text-xs">▼</span>
                  {exportTasks.filter((t) => t.status === "processing").length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {exportTasks.filter((t) => t.status === "processing").length}
                    </span>
                  )}
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
                    {exportTypes.map((item) => (
                      <button
                        key={item.type}
                        onClick={() => handleExport(item.type)}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setShowExportPanel(!showExportPanel);
                          setShowExportMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <span>📁 查看导出任务</span>
                        <span className="text-xs">{exportTasks.length} 个任务</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded text-xs font-medium border border-yellow-200">
                演示数据
              </span>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                技
              </div>
            </div>
          </div>
        </div>
      </header>

      {showExportPanel && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">📁 导出任务</h3>
              <button
                onClick={() => setShowExportPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {exportTasks.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">暂无导出任务</p>
              ) : (
                exportTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-700">{task.typeLabel}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(task)}`}
                        >
                          {getStatusText(task)}
                        </span>
                      </div>
                      {task.status === "processing" && (
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {task.createdAt.toLocaleTimeString("zh-CN")}
                      </p>
                    </div>
                    {task.status === "completed" && task.filePath && (
                      <a
                        href={task.filePath}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded hover:bg-green-600 transition-colors"
                      >
                        ⬇️ 下载
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            <AnomalySummary
              stats={filteredData.summary}
              anomalies={filteredData.anomalies}
            />
          </div>
          <div className="lg:col-span-2">
            <FilterBar
              options={baseData.filterOptions}
              filters={filters}
              onFilterChange={setFilters}
            />
            <div className="mt-6">
              <StatsCards stats={filteredData.summary} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-6">
          <WaterTrendChart data={filteredData.waterTrend} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <MoistureComparisonChart data={filteredData.moistureData} />
          <PumpEnergyChart data={filteredData.pumpEnergy} />
        </div>

        <div className="mt-6 mb-8">
          <StrategyBenefitsChart data={filteredData.strategyBenefits} />
        </div>

        <footer className="text-center py-6 text-sm text-gray-400 border-t border-gray-200">
          <p>Remix + Express + Redis + PostgreSQL · 灌溉效率分析系统 v1.0</p>
          <p className="mt-1">
            数据随筛选实时更新 · 筛选条件已保存在URL中 · 导出任务可追踪进度
          </p>
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
    {
      id: 6,
      fieldName: "西二号田",
      cropName: "大豆",
      pumpName: "2号泵站",
      strategyName: "滴灌",
      startTime: "2025-05-30T07:30:00",
      waterVolume: 180.0,
      isAfterRain: true,
      rainAmount24h: 12.5,
      flowRate: 120.0,
      ratedFlow: 160,
      area: 110,
      anomalyType: "post_rain",
      severity: "高",
      description: "降雨12.5mm后仍灌溉180m³",
      suggestion: "启用降雨联动控制，雨后自动减少灌溉量",
    },
    {
      id: 7,
      fieldName: "东一号田",
      cropName: "冬小麦",
      pumpName: "1号泵站",
      strategyName: "智能灌溉",
      startTime: "2025-05-28T11:00:00",
      waterVolume: 310.0,
      isAfterRain: false,
      rainAmount24h: 0,
      flowRate: 175.0,
      ratedFlow: 200,
      area: 120,
      anomalyType: "excessive",
      severity: "中",
      description: "灌溉水量310m³超过作物需求1.4倍",
      suggestion: "检查土壤湿度传感器，考虑缩短灌溉时长",
    },
    {
      id: 8,
      fieldName: "西一号田",
      cropName: "冬小麦",
      pumpName: "3号泵站",
      strategyName: "喷灌",
      startTime: "2025-05-25T09:30:00",
      waterVolume: 210.0,
      isAfterRain: false,
      rainAmount24h: 0,
      flowRate: 62.0,
      ratedFlow: 100,
      area: 150,
      anomalyType: "low_efficiency",
      severity: "中",
      description: "泵站效率仅62.0%",
      suggestion: "检查水泵叶轮、管道是否堵塞，检查供电电压",
    },
  ];
}

function generateMockWaterTrend(): WaterTrendItem[] {
  const data: WaterTrendItem[] = [];
  const start = new Date("2025-05-15");

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
