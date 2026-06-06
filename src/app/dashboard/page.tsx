"use client";

import { useMemo, useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/ui/KPICard";
import { ChartCard } from "@/components/ui/ChartCard";
import { SankeyChart } from "@/components/charts/SankeyChart";
import { WaitDistributionChart } from "@/components/charts/WaitDistributionChart";
import { DepartmentComparisonChart } from "@/components/charts/DepartmentComparisonChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { HeatmapChart } from "@/components/charts/HeatmapChart";
import { DepartmentMap } from "@/components/charts/DepartmentMap";
import { AnnotationModal } from "@/components/modals/AnnotationModal";
import { useAppStore, useAuthStore } from "@/store";
import { fetchVisits, getDataSources } from "@/lib/api";
import { exportToPDF } from "@/lib/pdf";
import {
  Clock,
  Users,
  AlertTriangle,
  Activity,
  Filter,
  Plus,
  FileText,
  Download,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { formatDate, downloadCSV } from "@/utils";
import { PROCESS_NODES, VisitProcess } from "@/types";

export default function DashboardPage() {
  const [annotationModalOpen, setAnnotationModalOpen] = useState(false);
  const [selectedAnnotationDate, setSelectedAnnotationDate] = useState<
    string | undefined
  >();
  const [activeTab, setActiveTab] = useState<"chart" | "map">("chart");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const filters = useAppStore((state) => state.filters);
  const setFilters = useAppStore((state) => state.setFilters);
  const toggleFilterPanel = useAppStore((state) => state.toggleFilterPanel);
  const annotations = useAppStore((state) => state.annotations);
  const getFilteredVisits = useAppStore((state) => state.getFilteredVisits);
  const getKPIMetrics = useAppStore((state) => state.getKPIMetrics);
  const getSankeyData = useAppStore((state) => state.getSankeyData);
  const getWaitDistribution = useAppStore((state) => state.getWaitDistribution);
  const getDepartmentComparison = useAppStore(
    (state) => state.getDepartmentComparison
  );
  const getTrendData = useAppStore((state) => state.getTrendData);
  const getHeatmapData = useAppStore((state) => state.getHeatmapData);
  const setAllVisits = useAppStore((state) => state.setAllVisits);
  const dataSources = getDataSources();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const loadData = async () => {
    if (dataSources.USE_MOCK_DATA) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      const params: Record<string, string | number> = {
        pageSize: 1000,
      };
      if (filters.departments?.length) params.deptId = filters.departments[0];
      if (filters.doctors?.length) params.doctorId = filters.doctors[0];
      if (filters.patientTypes?.length) params.patientTypeId = filters.patientTypes[0];
      if (filters.dateRange?.[0]) params.startDate = filters.dateRange[0];
      if (filters.dateRange?.[1]) params.endDate = filters.dateRange[1];

      const result = await fetchVisits(params);

      if (result.success && result.data) {
        setAllVisits(result.data as VisitProcess[]);
      } else {
        setLoadError(result.error || "数据加载失败");
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      setLoadError(error instanceof Error ? error.message : "数据加载失败");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await exportToPDF("dashboard-content", {
        title: "医院门诊等待时间分析报告",
        filters,
      });
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const filteredVisits = useMemo(() => getFilteredVisits(), [
    filters,
    getFilteredVisits,
  ]);
  const kpiMetrics = useMemo(() => getKPIMetrics(), [getKPIMetrics]);
  const sankeyData = useMemo(() => getSankeyData(), [getSankeyData]);
  const waitDistribution = useMemo(() => getWaitDistribution(), [
    getWaitDistribution,
  ]);
  const deptComparison = useMemo(() => getDepartmentComparison(), [
    getDepartmentComparison,
  ]);
  const trendData = useMemo(() => getTrendData(), [getTrendData]);
  const heatmapData = useMemo(() => getHeatmapData(), [getHeatmapData]);

  const handleDeptClick = (deptId: string) => {
    setFilters({ departments: [deptId] });
  };

  const handleNodeClick = (nodeName: string) => {
    const node = PROCESS_NODES.find((n) => n.name === nodeName);
    console.log("节点点击:", node);
  };

  const handlePointClick = (date: string) => {
    setSelectedAnnotationDate(date);
    setAnnotationModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = [
      "就诊日期",
      "科室",
      "医生",
      "患者类型",
      "挂号时间",
      "签到时间",
      "分诊时间",
      "叫号时间",
      "缴费时间",
      "取药时间",
      "总等待(分钟)",
      "就诊等待(分钟)",
    ];

    const rows = filteredVisits.map((v) => [
      v.visitDate,
      v.department?.deptName || "",
      v.doctor?.doctorNameMasked || "",
      v.patientType?.typeName || "",
      v.registerTime || "",
      v.checkinTime || "",
      v.triageTime || "",
      v.callTime || "",
      v.paymentTime || "",
      v.medicineTime || "",
      v.waitTotalMinutes || "",
      v.waitDoctorMinutes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    downloadCSV(csvContent, `门诊等待分析_${formatDate(new Date().toISOString())}.csv`);
  };

  return (
    <DashboardLayout>
      <div id="dashboard-content" className="space-y-4">
        {/* 状态提示 */}
        {!dataSources.USE_MOCK_DATA && !isAuthenticated && (
          <div className="flex items-start gap-3 p-4 bg-warning-50 rounded-lg border border-warning-200">
            <AlertCircle className="w-5 h-5 text-warning-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-warning-700">未登录状态</p>
              <p className="text-xs text-warning-600 mt-0.5">
                当前使用真实 API 模式，部分功能可能受限。请先
                <a href="/login" className="underline font-medium">登录</a>
              </p>
            </div>
          </div>
        )}

        {loadError && (
          <div className="flex items-start gap-3 p-4 bg-danger-50 rounded-lg border border-danger-200">
            <AlertCircle className="w-5 h-5 text-danger-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-danger-700">数据加载失败</p>
              <p className="text-xs text-danger-600 mt-0.5">{loadError}</p>
            </div>
          </div>
        )}

        {/* 工具栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFilterPanel}
              className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              筛选
            </button>
            <span className="text-sm text-neutral-500">
              共 {filteredVisits.length} 条记录
              {dataSources.USE_MOCK_DATA && " (模拟数据)"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!dataSources.USE_MOCK_DATA && (
              <button
                onClick={loadData}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "加载中..." : "刷新"}
              </button>
            )}
            <button
              onClick={() => setAnnotationModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加标注
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              导出CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-success-500 rounded-md hover:bg-success-600 transition-colors disabled:opacity-50"
            >
              {isExportingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {isExportingPDF ? "生成中..." : "导出PDF"}
            </button>
          </div>
        </div>

        {/* KPI 指标卡 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="平均总等待时间"
            value={kpiMetrics.avgWaitTotal}
            unit="分钟"
            isTime={true}
            trend={kpiMetrics.avgWaitTrend}
            icon={<Clock className="w-5 h-5" />}
            color="primary"
          />
          <KPICard
            title="就诊患者总量"
            value={kpiMetrics.totalVisits}
            unit="人次"
            icon={<Users className="w-5 h-5" />}
            color="success"
          />
          <KPICard
            title="最长等待时间"
            value={kpiMetrics.maxWaitTotal}
            unit="分钟"
            isTime={true}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="warning"
          />
          <KPICard
            title="当前瓶颈节点"
            value={kpiMetrics.bottleneckNode}
            icon={<Activity className="w-5 h-5" />}
            color="danger"
          />
        </div>

        {/* 流程桑基图 */}
        <div data-chart="sankey" data-chart-title="门诊全流程等待分析">
          <ChartCard
            title="门诊全流程等待分析"
            subtitle="患者从挂号到取药的全流程流转及各环节等待时间"
          >
            <SankeyChart data={sankeyData} height={320} onNodeClick={handleNodeClick} />
          </ChartCard>
        </div>

        {/* 图表网格 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 等待时间分布 */}
          <div data-chart="distribution" data-chart-title="等待时间分布">
            <ChartCard
              title="等待时间分布"
              subtitle="不同等待时长区间的患者数量分布"
            >
              <WaitDistributionChart data={waitDistribution} height={280} />
            </ChartCard>
          </div>

          {/* 科室等待对比 */}
          <div data-chart="comparison" data-chart-title="科室等待对比">
            <ChartCard
              title="科室等待对比"
              subtitle="各科室平均等待时间与就诊人次对比"
              actions={
                <div className="flex items-center gap-1 bg-neutral-100 rounded-md p-0.5">
                  <button
                    onClick={() => setActiveTab("chart")}
                    className={`px-2 py-1 text-xs rounded ${
                      activeTab === "chart"
                        ? "bg-white text-primary-600 shadow-sm"
                        : "text-neutral-500"
                    }`}
                  >
                    图表
                  </button>
                  <button
                    onClick={() => setActiveTab("map")}
                    className={`px-2 py-1 text-xs rounded ${
                      activeTab === "map"
                        ? "bg-white text-primary-600 shadow-sm"
                        : "text-neutral-500"
                    }`}
                  >
                    地图
                  </button>
                </div>
              }
            >
              {activeTab === "chart" ? (
                <DepartmentComparisonChart
                  data={deptComparison}
                  height={280}
                  onDeptClick={handleDeptClick}
                />
              ) : (
                <DepartmentMap comparisonData={deptComparison} height={280} />
              )}
            </ChartCard>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 趋势分析 */}
          <div data-chart="trend" data-chart-title="等待时间趋势">
            <ChartCard
              title="等待时间趋势"
              subtitle="近30天平均等待时间变化趋势，点击数据点可添加标注"
            >
              <TrendChart
                data={trendData}
                annotations={annotations}
                height={280}
                onPointClick={handlePointClick}
              />
            </ChartCard>
          </div>

          {/* 时段热力图 */}
          <div data-chart="heatmap" data-chart-title="日内时段热力图">
            <ChartCard
              title="日内时段热力图"
              subtitle="不同星期和时段的平均等待时间分布"
            >
              <HeatmapChart data={heatmapData} height={280} />
            </ChartCard>
          </div>
        </div>

        {/* 近期标注列表 */}
        <ChartCard title="异常标注记录" subtitle="近期添加的异常情况标注">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {annotations.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-sm">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>暂无异常标注</p>
              </div>
            ) : (
              annotations.slice(0, 5).map((ann) => (
                <div
                  key={ann.id}
                  className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg"
                >
                  <div className="p-1.5 bg-warning-50 rounded-md">
                    <AlertTriangle className="w-4 h-4 text-warning-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-neutral-800">
                        {ann.metadata?.date || "-"}
                      </p>
                      <span className="text-xs text-neutral-400">
                        {ann.annotationType}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 mt-0.5 truncate">
                      {ann.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ChartCard>
      </div>

      <AnnotationModal
        isOpen={annotationModalOpen}
        onClose={() => {
          setAnnotationModalOpen(false);
          setSelectedAnnotationDate(undefined);
        }}
        defaultDate={selectedAnnotationDate}
      />
    </DashboardLayout>
  );
}
