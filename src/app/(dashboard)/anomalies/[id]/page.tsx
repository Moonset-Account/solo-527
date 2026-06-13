"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Info,
  TrendingDown,
  TrendingUp,
  MessageSquare,
  Send,
  CheckCircle,
  Eye,
  Search,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { api } from "@/trpc/react";
import {
  severityConfig,
  statusConfig,
  rootCauseCategories,
  formatNumber,
  formatDateTime,
  getRelativeTime,
} from "@/utils/format";
import { MetricDefinitionDrawer } from "@/components/dashboard/MetricDefinitionDrawer";

function generateTrendData(expectedValue: number, days: number) {
  const data = [];
  const base = expectedValue;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let variation = (Math.random() - 0.5) * 0.15;
    if (isWeekend) variation += 0.08;

    const value = base * (1 + variation);

    data.push({
      date: date.toISOString().split("T")[0],
      value: Math.round(value * 100) / 100,
      expected: expectedValue,
    });
  }

  return data;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-neutral-700 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-neutral-600">{entry.name}:</span>
            <span className="font-medium text-neutral-800">
              {formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neutral-100">
            <ArrowLeft className="w-5 h-5 text-neutral-300" />
          </div>
          <div>
            <div className="h-6 w-24 bg-neutral-200 rounded mb-1" />
            <div className="h-4 w-32 bg-neutral-200 rounded" />
          </div>
        </div>
        <div className="h-9 w-28 bg-neutral-200 rounded-lg" />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-[60%] space-y-6">
          <div className="card p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-neutral-100" />
                <div>
                  <div className="h-5 w-32 bg-neutral-200 rounded mb-1" />
                  <div className="h-4 w-24 bg-neutral-200 rounded" />
                </div>
              </div>
              <div className="h-6 w-12 bg-neutral-200 rounded-full" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-neutral-50 rounded-lg p-3">
                  <div className="h-3 w-8 bg-neutral-200 rounded mb-2" />
                  <div className="h-5 w-16 bg-neutral-200 rounded" />
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="h-5 w-20 bg-neutral-200 rounded mb-4" />
            <div className="h-56 bg-neutral-50 rounded-lg" />
          </div>
        </div>

        <div className="lg:w-[40%] space-y-6">
          <div className="card p-5">
            <div className="h-5 w-24 bg-neutral-200 rounded mb-4" />
            <div className="space-y-3">
              <div className="h-10 bg-neutral-100 rounded-lg" />
              <div className="h-20 bg-neutral-100 rounded-lg" />
              <div className="h-10 bg-neutral-100 rounded-lg" />
            </div>
          </div>

          <div className="card p-5">
            <div className="h-5 w-24 bg-neutral-200 rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-neutral-50 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnomalyDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const ctx = api.useUtils();

  const {
    data: anomaly,
    isLoading,
    isError,
    error,
  } = api.anomaly.getById.useQuery(id, { enabled: !!id });

  const statusMutation = api.anomaly.updateStatus.useMutation();
  const rootCauseMutation = api.anomaly.updateRootCause.useMutation();
  const addCommentMutation = api.anomaly.addComment.useMutation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rootCauseCategory, setRootCauseCategory] = useState("");
  const [rootCauseDesc, setRootCauseDesc] = useState("");
  const [newComment, setNewComment] = useState("");
  const [rootCauseSaved, setRootCauseSaved] = useState(false);

  useEffect(() => {
    if (anomaly) {
      setRootCauseCategory(anomaly.rootCauseCategory || "");
      setRootCauseDesc(anomaly.rootCause || "");
      setRootCauseSaved(false);
    }
  }, [anomaly?.id]);

  const trendData = useMemo(() => {
    if (!anomaly) return [];
    return generateTrendData(anomaly.expectedValue, 30);
  }, [anomaly?.expectedValue, anomaly?.id]);

  if (isLoading) {
    return <SkeletonDetail />;
  }

  if (isError || !anomaly) {
    const isNotFound = error?.data?.code === "NOT_FOUND";
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="w-16 h-16 text-neutral-300 mb-4" />
        <p className="text-neutral-500 text-lg">
          {isNotFound ? "异常记录不存在" : "加载失败"}
        </p>
        <Link
          href="/anomalies"
          className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          返回异常列表
        </Link>
      </div>
    );
  }

  const comments = anomaly.comments ?? [];
  const currentStatus = anomaly.status;

  const severity = severityConfig[anomaly.severity as keyof typeof severityConfig];
  const status = statusConfig[currentStatus as keyof typeof statusConfig];
  const isNegative = anomaly.deviationPercentage < 0;

  const handleRootCauseSave = () => {
    rootCauseMutation.mutate(
      {
        id,
        rootCause: rootCauseDesc,
        rootCauseCategory,
        summary: "",
      },
      {
        onSuccess: () => {
          setRootCauseSaved(true);
          ctx.anomaly.getById.invalidate(id);
          setTimeout(() => setRootCauseSaved(false), 2000);
        },
      }
    );
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(
      {
        anomalyId: id,
        content: newComment.trim(),
      },
      {
        onSuccess: () => {
          ctx.anomaly.getById.invalidate(id);
          setNewComment("");
        },
      }
    );
  };

  const handleStatusUpdate = (newStatus: string) => {
    statusMutation.mutate(
      {
        id,
        status: newStatus as "OPEN" | "INVESTIGATING" | "RESOLVED" | "IGNORED",
      },
      {
        onSuccess: () => {
          ctx.anomaly.getById.invalidate(id);
        },
      }
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/anomalies"
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-500" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-neutral-800">
              异常详情
            </h1>
            <p className="text-sm text-neutral-500">
              {anomaly.metric.name} · {anomaly.id}
            </p>
          </div>
        </div>

        <button
          onClick={() => setDrawerOpen(true)}
          className="btn btn-secondary text-sm"
        >
          <Info className="w-4 h-4" />
          查看指标口径
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-[60%] space-y-6">
          <div className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl ${severity.bg} flex items-center justify-center`}
                >
                  <AlertTriangle
                    className={`w-6 h-6 ${severity.color}`}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-800">
                    {anomaly.metric.name}异常
                  </h2>
                  <p className="text-sm text-neutral-500">
                    {anomaly.alertRule?.name}
                  </p>
                </div>
              </div>
              <span className={`badge ${severity.bg} ${severity.color}`}>
                {severity.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-neutral-50 rounded-lg p-3">
                <p className="text-xs text-neutral-500 mb-1">状态</p>
                <span className={`badge ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3">
                <p className="text-xs text-neutral-500 mb-1">检测时间</p>
                <p className="text-sm font-medium text-neutral-800">
                  {formatDateTime(anomaly.detectedAt)}
                </p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3">
                <p className="text-xs text-neutral-500 mb-1">监控周期</p>
                <p className="text-sm font-medium text-neutral-800">
                  {formatDateTime(anomaly.periodStart)} ~{" "}
                  {formatDateTime(anomaly.periodEnd)}
                </p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3">
                <p className="text-xs text-neutral-500 mb-1">负责人</p>
                <p className="text-sm font-medium text-neutral-800">
                  {anomaly.assignedTo?.name || "未分配"}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-neutral-800 mb-4">
              数值对比
            </h3>
            <div className="flex items-center gap-6 mb-4">
              <div className="flex-1">
                <p className="text-xs text-neutral-500 mb-1">实际值</p>
                <p className="text-2xl font-bold font-mono text-neutral-800">
                  {formatNumber(anomaly.actualValue)}
                </p>
                <p className="text-xs text-neutral-400">
                  {anomaly.metric.unit}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-neutral-500 mb-1">预期值</p>
                <p className="text-2xl font-bold font-mono text-neutral-800">
                  {formatNumber(anomaly.expectedValue)}
                </p>
                <p className="text-xs text-neutral-400">
                  {anomaly.metric.unit}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-neutral-500 mb-1">偏差</p>
                <div className="flex items-center gap-2">
                  {isNegative ? (
                    <TrendingDown className="w-6 h-6 text-red-500" />
                  ) : (
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                  )}
                  <span
                    className={`text-2xl font-bold font-mono ${
                      isNegative ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {isNegative ? "" : "+"}
                    {anomaly.deviationPercentage}%
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full bg-neutral-100 rounded-full h-3 mb-2">
              <div
                className={`h-3 rounded-full transition-all ${
                  isNegative
                    ? "bg-gradient-to-r from-red-400 to-red-500"
                    : "bg-gradient-to-r from-emerald-400 to-emerald-500"
                }`}
                style={{
                  width: `${Math.min(
                    Math.abs(anomaly.deviationPercentage) * 2,
                    100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-neutral-400">
              偏差可视化（偏差率: {isNegative ? "" : "+"}
              {anomaly.deviationPercentage}%）
            </p>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-neutral-800 mb-4">
              指标趋势
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorActual"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#3b82f6"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      const d = new Date(value);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                    interval={6}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={anomaly.expectedValue}
                    stroke="#f59e0b"
                    strokeDasharray="6 3"
                    strokeWidth={1.5}
                    label={{
                      value: "预期值",
                      position: "right",
                      fill: "#f59e0b",
                      fontSize: 11,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="实际值"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorActual)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="lg:w-[40%] space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-primary-600" />
                <h3 className="text-sm font-semibold text-neutral-800">
                  根因分析
                </h3>
              </div>
              {rootCauseSaved && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  已保存
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                  根因类别
                </label>
                <select
                  value={rootCauseCategory}
                  onChange={(e) => {
                    setRootCauseCategory(e.target.value);
                    setRootCauseSaved(false);
                  }}
                  className="select"
                >
                  <option value="">请选择根因类别</option>
                  {rootCauseCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                  原因描述
                </label>
                <textarea
                  value={rootCauseDesc}
                  onChange={(e) => {
                    setRootCauseDesc(e.target.value);
                    setRootCauseSaved(false);
                  }}
                  rows={3}
                  className="input resize-none"
                  placeholder="描述异常的根因..."
                />
              </div>

              <button
                onClick={handleRootCauseSave}
                disabled={
                  rootCauseMutation.isPending ||
                  (!rootCauseCategory && !rootCauseDesc)
                }
                className="btn btn-primary text-sm w-full disabled:opacity-40"
              >
                {rootCauseMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    保存根因
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-primary-600" />
              <h3 className="text-sm font-semibold text-neutral-800">
                处理记录
              </h3>
              <span className="badge badge-neutral">{comments.length}</span>
            </div>

            <div className="space-y-0 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
              {comments.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">
                  暂无处理记录
                </p>
              ) : (
                comments.map((comment, index) => (
                  <div
                    key={comment.id}
                    className="relative pl-5 pb-4 border-l-2 border-neutral-100 last:border-l-0"
                  >
                    <div
                      className={`absolute -left-[5px] top-0 w-2 h-2 rounded-full ${
                        index === 0 ? "bg-primary-500" : "bg-neutral-300"
                      }`}
                    />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-neutral-700">
                        {comment.user?.name || "系统"}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {getRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                className="input flex-1"
                placeholder="添加评论..."
                disabled={addCommentMutation.isPending}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || addCommentMutation.isPending}
                className="btn btn-primary px-3 disabled:opacity-40"
              >
                {addCommentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-neutral-800 mb-3">
              状态操作
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentStatus !== "INVESTIGATING" && (
                <button
                  onClick={() => handleStatusUpdate("INVESTIGATING")}
                  disabled={statusMutation.isPending}
                  className="btn btn-secondary text-sm disabled:opacity-40"
                >
                  {statusMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  标记处理中
                </button>
              )}
              {currentStatus !== "RESOLVED" && (
                <button
                  onClick={() => handleStatusUpdate("RESOLVED")}
                  disabled={statusMutation.isPending}
                  className="btn text-sm bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 disabled:opacity-40"
                >
                  {statusMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  标记已解决
                </button>
              )}
              {currentStatus !== "IGNORED" && (
                <button
                  onClick={() => handleStatusUpdate("IGNORED")}
                  disabled={statusMutation.isPending}
                  className="btn text-sm bg-neutral-200 text-neutral-600 hover:bg-neutral-300 focus:ring-neutral-400 disabled:opacity-40"
                >
                  {statusMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  忽略
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <MetricDefinitionDrawer
        metricId={anomaly.metricId}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
