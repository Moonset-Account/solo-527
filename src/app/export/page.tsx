"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChartCard } from "@/components/ui/ChartCard";
import { useAppStore, useAuthStore } from "@/store";
import {
  FileDown,
  FileText,
  FileSpreadsheet,
  Download,
  Check,
  Clock,
  AlertCircle,
  Calendar,
  Building2,
  Users,
  Activity,
  RefreshCw,
  Trash2,
  ArrowRight,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn, formatDate, formatDateTime, downloadCSV } from "@/utils";
import { exportToPDF } from "@/lib/pdf";
import { format } from "date-fns";
import { generateCSV } from "@/lib/csv";
import { getDataSources, fetchVisits } from "@/lib/api";
import { VisitProcess } from "@/types";

interface ExportTask {
  id: string;
  name: string;
  type: "csv" | "pdf";
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  filters: Record<string, any>;
  recordCount?: number;
  fileSize?: string;
  errorMessage?: string;
}

const mockExportTasks: ExportTask[] = [
  {
    id: "exp-001",
    name: "门诊等待数据_2024年1月",
    type: "csv",
    status: "completed",
    createdAt: "2024-01-31 18:30:00",
    filters: { dateRange: ["2024-01-01", "2024-01-31"] },
    recordCount: 15680,
    fileSize: "4.2 MB",
  },
  {
    id: "exp-002",
    name: "内科等待分析报告",
    type: "pdf",
    status: "completed",
    createdAt: "2024-01-30 14:20:00",
    filters: { departments: ["dept-001"] },
    recordCount: 2450,
    fileSize: "1.8 MB",
  },
  {
    id: "exp-003",
    name: "高峰时段等待数据",
    type: "csv",
    status: "processing",
    createdAt: "2024-01-31 10:15:00",
    filters: { timeSlots: ["morning", "afternoon"] },
  },
  {
    id: "exp-004",
    name: "患者类型对比数据",
    type: "csv",
    status: "failed",
    createdAt: "2024-01-29 09:00:00",
    filters: { patientTypes: ["pt-001", "pt-002"] },
    errorMessage: "数据量过大，请缩小筛选范围",
  },
];

const exportTemplates = [
  {
    id: "tpl-001",
    name: "全量数据导出",
    description: "导出所有就诊流程的明细数据，包含所有时间戳和等待时长",
    icon: FileSpreadsheet,
    type: "csv",
    fields: 20,
  },
  {
    id: "tpl-002",
    name: "科室汇总报表",
    description: "按科室汇总的等待时间统计，包含均值、中位数、P95等指标",
    icon: Building2,
    type: "csv",
    fields: 12,
  },
  {
    id: "tpl-003",
    name: "数据分析报告",
    description: "包含图表和统计分析的完整PDF报告",
    icon: FileText,
    type: "pdf",
    pages: 15,
  },
  {
    id: "tpl-004",
    name: "医生效率分析",
    description: "按医生维度的等待时间和接诊效率分析",
    icon: Users,
    type: "csv",
    fields: 10,
  },
  {
    id: "tpl-005",
    name: "时段趋势数据",
    description: "按时段和日期聚合的等待时间趋势数据",
    icon: Activity,
    type: "csv",
    fields: 8,
  },
  {
    id: "tpl-006",
    name: "异常标注导出",
    description: "导出所有异常点标注及其关联数据",
    icon: AlertCircle,
    type: "csv",
    fields: 10,
  },
];

export default function ExportCenterPage() {
  const [activeTab, setActiveTab] = useState<"export" | "history">("export");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [exportTasks, setExportTasks] = useState<ExportTask[]>(mockExportTasks);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const filters = useAppStore((state) => state.filters);
  const getFilteredVisits = useAppStore((state) => state.getFilteredVisits);
  const getKPIMetrics = useAppStore((state) => state.getKPIMetrics);
  const setAllVisits = useAppStore((state) => state.setAllVisits);
  const dataSources = getDataSources();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();

  const filteredVisits = useMemo(() => getFilteredVisits(), [filters, getFilteredVisits]);
  const kpiMetrics = useMemo(() => getKPIMetrics(), [getKPIMetrics]);

  const loadDataForExport = async () => {
    if (dataSources.USE_MOCK_DATA) return true;
    if (!isAuthenticated) return false;

    setIsLoading(true);
    try {
      const result = await fetchVisits({ pageSize: "1000" });
      if (result.success && result.data) {
        setAllVisits(result.data as VisitProcess[]);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to load data:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
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
      "挂号等待(分钟)",
      "分诊等待(分钟)",
      "就诊等待(分钟)",
      "缴费等待(分钟)",
      "取药等待(分钟)",
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
      v.waitRegisterMinutes || "",
      v.waitTriageMinutes || "",
      v.waitDoctorMinutes || "",
      v.waitPaymentMinutes || "",
      v.waitMedicineMinutes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    downloadCSV(csvContent, `门诊等待分析_${formatDate(new Date().toISOString())}.csv`);
  };

  const handleCreateExportTask = async (templateId: string) => {
    const template = exportTemplates.find((t) => t.id === templateId);
    if (!template) return;

    if (!dataSources.USE_MOCK_DATA && !isAuthenticated) {
      alert("请先登录后再导出数据");
      return;
    }

    if (template.type === "pdf") {
      router.push("/dashboard?export=pdf");
      return;
    }

    setIsExporting(true);
    
    const newTask: ExportTask = {
      id: `exp-${Date.now()}`,
      name: `${template.name}_${format(new Date(), "yyyyMMdd_HHmmss")}`,
      type: template.type as "csv" | "pdf",
      status: "processing",
      createdAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      filters: filters,
    };

    setExportTasks((prev) => [newTask, ...prev]);
    setSelectedTemplate(null);

    try {
      await loadDataForExport();

      if (template.type === "csv") {
        const headers = [
          "就诊日期", "科室", "医生", "患者类型",
          "挂号时间", "签到时间", "分诊时间", "叫号时间", "缴费时间", "取药时间",
          "总等待(分钟)", "挂号等待(分钟)", "分诊等待(分钟)", "就诊等待(分钟)", "缴费等待(分钟)", "取药等待(分钟)"
        ];

        const rows = filteredVisits.map((v) => ({
          "就诊日期": v.visitDate || "",
          "科室": v.department?.deptName || "",
          "医生": v.doctor?.doctorNameMasked || "",
          "患者类型": v.patientType?.typeName || "",
          "挂号时间": v.registerTime || "",
          "签到时间": v.checkinTime || "",
          "分诊时间": v.triageTime || "",
          "叫号时间": v.callTime || "",
          "缴费时间": v.paymentTime || "",
          "取药时间": v.medicineTime || "",
          "总等待(分钟)": v.waitTotalMinutes || "",
          "挂号等待(分钟)": v.waitRegisterMinutes || "",
          "分诊等待(分钟)": v.waitTriageMinutes || "",
          "就诊等待(分钟)": v.waitDoctorMinutes || "",
          "缴费等待(分钟)": v.waitPaymentMinutes || "",
          "取药等待(分钟)": v.waitMedicineMinutes || "",
        }));

        const csvContent = generateCSV(rows, headers);
        downloadCSV(csvContent, `${newTask.name}.csv`);
      }

      setExportTasks((prev) =>
        prev.map((t) =>
          t.id === newTask.id
            ? {
                ...t,
                status: "completed",
                recordCount: filteredVisits.length,
                fileSize: `${(filteredVisits.length * 0.25 / 1024).toFixed(2)} MB`,
              }
            : t
        )
      );
    } catch (error) {
      console.error("Export failed:", error);
      setExportTasks((prev) =>
        prev.map((t) =>
          t.id === newTask.id
            ? {
                ...t,
                status: "failed",
                errorMessage: error instanceof Error ? error.message : "导出失败",
              }
            : t
        )
      );
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusIcon = (status: ExportTask["status"]) => {
    switch (status) {
      case "completed":
        return <Check className="w-4 h-4 text-success-500" />;
      case "processing":
        return <RefreshCw className="w-4 h-4 text-primary-500 animate-spin" />;
      case "pending":
        return <Clock className="w-4 h-4 text-warning-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-danger-500" />;
    }
  };

  const getStatusText = (status: ExportTask["status"]) => {
    switch (status) {
      case "completed":
        return "已完成";
      case "processing":
        return "处理中";
      case "pending":
        return "等待中";
      case "failed":
        return "失败";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
              <FileDown className="w-5 h-5 text-primary-500" />
              导出中心
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              导出数据报表和分析报告，支持CSV和PDF格式
            </p>
          </div>
          {dataSources.USE_MOCK_DATA && (
            <span className="text-xs bg-info-50 text-info-600 px-2 py-1 rounded border border-info-200">
              模拟数据模式
            </span>
          )}
        </div>

        {!dataSources.USE_MOCK_DATA && !isAuthenticated && (
          <div className="flex items-start gap-3 p-4 bg-warning-50 rounded-lg border border-warning-200">
            <AlertTriangle className="w-5 h-5 text-warning-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-warning-700">未登录状态</p>
              <p className="text-xs text-warning-600 mt-0.5">
                当前使用真实 API 模式，需要先登录才能导出数据。请先前往
                <a href="/login" className="underline font-medium">登录页面</a>
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 p-4 bg-info-50 rounded-lg border border-info-200">
          <Info className="w-5 h-5 text-info-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-info-700">PDF 导出说明</p>
            <p className="text-xs text-info-600 mt-0.5">
              导出数据分析报告（PDF）将跳转到 Dashboard 页面，在确认数据无误后点击"导出PDF"按钮即可生成完整报告。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-neutral-100 rounded-md p-0.5 w-fit">
          <button
            onClick={() => setActiveTab("export")}
            className={cn(
              "px-4 py-2 text-sm rounded transition-colors",
              activeTab === "export"
                ? "bg-white text-primary-600 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Download className="w-4 h-4" />
              新建导出
            </span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-4 py-2 text-sm rounded transition-colors",
              activeTab === "history"
                ? "bg-white text-primary-600 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              导出历史
            </span>
          </button>
        </div>

        {activeTab === "export" ? (
          <div className="space-y-4">
            <ChartCard
              title="当前筛选条件"
              subtitle="导出数据将应用以下筛选条件"
              actions={
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded">
                    共 {filteredVisits.length} 条记录
                  </span>
                </div>
              }
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    日期范围
                  </div>
                  <p className="text-sm font-medium text-neutral-800">
                    {filters.dateRange
                      ? `${formatDate(filters.dateRange[0])} ~ ${formatDate(filters.dateRange[1])}`
                      : "全部时间"}
                  </p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                    <Building2 className="w-3.5 h-3.5" />
                    科室
                  </div>
                  <p className="text-sm font-medium text-neutral-800">
                    {filters.departments.length > 0
                      ? `已选 ${filters.departments.length} 个`
                      : "全部科室"}
                  </p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                    <Users className="w-3.5 h-3.5" />
                    患者类型
                  </div>
                  <p className="text-sm font-medium text-neutral-800">
                    {filters.patientTypes.length > 0
                      ? `已选 ${filters.patientTypes.length} 个`
                      : "全部类型"}
                  </p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                    <Activity className="w-3.5 h-3.5" />
                    时段
                  </div>
                  <p className="text-sm font-medium text-neutral-800">
                    {filters.timeSlots.length > 0
                      ? `已选 ${filters.timeSlots.length} 个`
                      : "全部时段"}
                  </p>
                </div>
              </div>
            </ChartCard>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exportTemplates.map((template) => {
                const Icon = template.icon;
                const isSelected = selectedTemplate === template.id;
                const isPDF = template.type === "pdf";
                return (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-all relative",
                      isSelected
                        ? "border-primary-500 bg-primary-50/50 shadow-sm"
                        : "border-neutral-200 hover:border-primary-300 hover:bg-neutral-50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "p-2.5 rounded-lg",
                          template.type === "csv"
                            ? "bg-success-50 text-success-600"
                            : "bg-danger-50 text-danger-600"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-neutral-800 text-sm">
                            {template.name}
                          </h3>
                          <span
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded",
                              template.type === "csv"
                                ? "bg-success-100 text-success-700"
                                : "bg-danger-100 text-danger-700"
                            )}
                          >
                            {template.type.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {"fields" in template && (
                            <span className="text-xs text-neutral-400">
                              {template.fields} 个字段
                            </span>
                          )}
                          {"pages" in template && (
                            <span className="text-xs text-neutral-400">
                              约 {template.pages} 页
                            </span>
                          )}
                        </div>
                        {isPDF && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-info-600">
                            <ArrowRight className="w-3 h-3" />
                            将跳转到 Dashboard 页面导出
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-primary-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateExportTask(template.id);
                          }}
                          disabled={isExporting || isLoading}
                          className={cn(
                            "w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                            isPDF
                              ? "bg-info-500 hover:bg-info-600"
                              : "bg-primary-500 hover:bg-primary-600"
                          )}
                        >
                          {isExporting || isLoading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              生成中...
                            </>
                          ) : (
                            <>
                              {isPDF ? (
                                <>
                                  <ArrowRight className="w-4 h-4" />
                                  前往 Dashboard 导出
                                </>
                              ) : (
                                <>
                                  <Download className="w-4 h-4" />
                                  立即导出
                                </>
                              )}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-3 p-4 bg-neutral-50 rounded-lg border border-dashed border-neutral-300">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                快速导出当前筛选数据 (CSV)
              </button>
            </div>
          </div>
        ) : (
          <ChartCard title="导出历史记录" subtitle="查看和下载历史导出任务">
            <div className="space-y-2">
              {exportTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:border-primary-200 hover:bg-primary-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        task.type === "csv"
                          ? "bg-success-50 text-success-600"
                          : "bg-danger-50 text-danger-600"
                      )}
                    >
                      {task.type === "csv" ? (
                        <FileSpreadsheet className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-800">
                        {task.name}
                      </h4>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-neutral-500">
                          {formatDateTime(task.createdAt)}
                        </span>
                        {task.recordCount && (
                          <span className="text-xs text-neutral-500">
                            {task.recordCount.toLocaleString()} 条记录
                          </span>
                        )}
                        {task.fileSize && (
                          <span className="text-xs text-neutral-500">
                            {task.fileSize}
                          </span>
                        )}
                      </div>
                      {task.errorMessage && (
                        <p className="text-xs text-danger-500 mt-0.5">
                          {task.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(task.status)}
                      <span
                        className={cn(
                          "text-xs",
                          task.status === "completed" && "text-success-600",
                          task.status === "processing" && "text-primary-600",
                          task.status === "pending" && "text-warning-600",
                          task.status === "failed" && "text-danger-600"
                        )}
                      >
                        {getStatusText(task.status)}
                      </span>
                    </div>
                    {task.status === "completed" && (
                      <button className="p-1.5 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    <button className="p-1.5 text-neutral-400 hover:text-danger-500 hover:bg-danger-50 rounded transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        )}

        <ChartCard title="导出说明" subtitle="数据导出的格式和范围说明">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-neutral-800">CSV格式说明</h4>
              <ul className="text-xs text-neutral-500 space-y-1">
                <li>• 编码格式：UTF-8 with BOM（支持Excel直接打开）</li>
                <li>• 分隔符：英文逗号</li>
                <li>• 日期格式：YYYY-MM-DD HH:mm:ss</li>
                <li>• 所有患者和医生信息均已脱敏处理</li>
                <li>• 单次导出最大支持10万条记录</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-neutral-800">PDF格式说明</h4>
              <ul className="text-xs text-neutral-500 space-y-1">
                <li>• 包含完整的图表和统计分析</li>
                <li>• 支持自定义封面和页眉页脚</li>
                <li>• 默认包含KPI指标、趋势图、对比分析</li>
                <li>• 可选择是否包含明细数据表</li>
                <li>• 生成时间取决于数据量，约30秒-2分钟</li>
              </ul>
            </div>
          </div>
        </ChartCard>
      </div>
    </DashboardLayout>
  );
}
