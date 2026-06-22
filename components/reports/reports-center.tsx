"use client";

import { useState, useCallback } from "react";
import { Download, BarChart3, TrendingUp, Calendar, FileSpreadsheet } from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { MonthlyReportData } from "@/lib/reports";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function ReportsCenter() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({
      type: "monthly",
      year: String(year),
      month: String(month),
    });
    return `/api/reports?${params.toString()}`;
  }, [year, month]);

  const { data: report, loading, error } = useApi<MonthlyReportData>(buildUrl());

  const handleExport = async () => {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "budget",
        format: "xlsx",
        filters: {
          startDate: `${year}-${String(month).padStart(2, "0")}-01`,
          endDate: `${year}-${String(month).padStart(2, "0")}-31`,
        },
      }),
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `月度报表_${year}-${String(month).padStart(2, "0")}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const chartData = report
    ? [
        { name: "总预算", value: report.totalBudget },
        { name: "已支出", value: report.totalSpent },
        { name: "增项金额", value: report.addonAmount },
      ]
    : [];

  const statusData = report
    ? [
        { name: "总项目数", value: report.totalProjects },
        { name: "已完成", value: report.completedProjects },
        { name: "超支项目", value: report.budgetOverruns },
      ]
    : [];

  const repairData = report
    ? [
        { name: "已上报", value: report.repairsReported },
        { name: "已完成", value: report.repairsCompleted },
        { name: "已超时", value: report.repairsOverdue },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">报表中心</h1>
          <p className="text-muted-foreground">
            查看月度运营数据，支持导出 Excel 报表用于月底复盘
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            className="w-32"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            min={2020}
            max={2100}
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} 月
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            导出报表
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-muted-foreground">加载报表中...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-destructive">加载失败: {error.message}</div>
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>总项目数</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  {report.totalProjects}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  已完成 {report.completedProjects} 个
                  <Badge variant="success" className="ml-2">
                    {((report.completedProjects / report.totalProjects) * 100 || 0).toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>总预算</CardDescription>
                <CardTitle className="text-2xl text-blue-600">
                  {formatCurrency(report.totalBudget)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  已支出 {formatCurrency(report.totalSpent)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>增项统计</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                  {report.totalAddons} 项
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  增项金额 {formatCurrency(report.addonAmount)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>平均预算偏差</CardDescription>
                <CardTitle
                  className={`text-2xl ${
                    report.averageBudgetVariance > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {report.averageBudgetVariance > 0 ? "+" : ""}
                  {report.averageBudgetVariance.toFixed(2)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {report.budgetOverruns} 个项目超支
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  预算分析
                </CardTitle>
                <CardDescription>本月预算、支出、增项对比</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  项目状态分布
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>返修情况统计</CardTitle>
                <CardDescription>本月返修任务处理情况</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={repairData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>客户反馈统计</CardTitle>
                <CardDescription>本月客户满意度</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-6xl font-bold text-yellow-500 mb-2">
                    {report.averageRating.toFixed(1)}
                    <span className="text-2xl ml-1">★</span>
                  </div>
                  <div className="text-lg text-muted-foreground">
                    共收到 {report.feedbackCount} 条反馈
                  </div>
                  <div className="flex gap-1 mt-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-3xl ${
                          star <= Math.round(report.averageRating)
                            ? "text-yellow-500"
                            : "text-gray-300"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>关键指标摘要</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-muted-foreground mb-1">总项目数</div>
                  <div className="text-xl font-bold">{report.totalProjects}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-muted-foreground mb-1">已完成项目</div>
                  <div className="text-xl font-bold text-green-600">
                    {report.completedProjects}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-muted-foreground mb-1">预算超支项目</div>
                  <div className="text-xl font-bold text-red-600">
                    {report.budgetOverruns}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-muted-foreground mb-1">平均预算偏差</div>
                  <div
                    className={`text-xl font-bold ${
                      report.averageBudgetVariance > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {report.averageBudgetVariance > 0 ? "+" : ""}
                    {report.averageBudgetVariance.toFixed(2)}%
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-muted-foreground mb-1">总预算</div>
                  <div className="text-xl font-bold">
                    {formatCurrency(report.totalBudget)}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-muted-foreground mb-1">总支出</div>
                  <div className="text-xl font-bold text-blue-600">
                    {formatCurrency(report.totalSpent)}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-muted-foreground mb-1">增项数量</div>
                  <div className="text-xl font-bold text-yellow-600">
                    {report.totalAddons}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-muted-foreground mb-1">增项金额</div>
                  <div className="text-xl font-bold text-yellow-600">
                    {formatCurrency(report.addonAmount)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
