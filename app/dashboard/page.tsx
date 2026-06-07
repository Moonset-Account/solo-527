"use client";

import { useEffect, useCallback } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import FilterBar from "@/components/FilterBar";
import KPICard from "@/components/KPICard";
import ChartCard from "@/components/ChartCard";
import ReasonTreeMap from "@/components/charts/ReasonTreeMap";
import CycleHistogram from "@/components/charts/CycleHistogram";
import ProductRanking from "@/components/charts/ProductRanking";
import ServiceChart from "@/components/charts/ServiceChart";
import RecordsTable from "@/components/RecordsTable";
import DetailPanel from "@/components/DetailPanel";
import { Download, ShieldCheck, FileText } from "lucide-react";
import SampleSizeIndicator from "@/components/SampleSizeIndicator";

export default function DashboardPage() {
  const {
    summary,
    reasons,
    cycle,
    products,
    service,
    loading,
    filters,
    fetchFilterOptions,
    fetchAll,
    buildQueryString,
  } = useDashboardStore();

  useEffect(() => {
    fetchFilterOptions();
    fetchAll();
  }, [fetchFilterOptions, fetchAll]);

  const handleExport = useCallback(() => {
    const qs = buildQueryString();
    window.open(`/api/export?${qs}`, "_blank");
  }, [buildQueryString]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-800">
              退货原因与退款周期分析看板
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              多维度数据洞察 · 可追溯原始记录 · 隐私合规保护
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-success-600" />
              <span>数据已脱敏 · 用户隐私保护中</span>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              导出数据
            </button>
          </div>
        </div>
      </header>

      <FilterBar />

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SampleSizeIndicator sampleSize={summary?.sampleSize || 0} />
            <span className="text-xs text-slate-500">
              时间范围: {filters.dateRange.start} 至 {filters.dateRange.end}
            </span>
          </div>
          {summary && (
            <div className="text-xs text-slate-500">
              数据一致性: {(summary.validation.dataConsistency * 100).toFixed(1)}% ·
              最后更新: {new Date(summary.validation.lastUpdate).toLocaleString("zh-CN")}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="退货单总数"
            value={summary?.totalReturns || 0}
            trend={summary?.trend.returns}
            trendUnit="单"
            trendIsGood={(v) => v < 0}
            subtitle="较上一周期变化"
            loading={loading.summary}
          />
          <KPICard
            title="退货率"
            value={summary?.returnRate || 0}
            unit="%"
            trend={summary?.trend.returns}
            trendUnit="%"
            trendIsGood={(v) => v < 0}
            subtitle="退货单 / 总订单"
            loading={loading.summary}
          />
          <KPICard
            title="平均退款周期"
            value={summary?.avgRefundCycle || 0}
            unit="天"
            trend={summary?.trend.refundCycle}
            trendUnit="天"
            trendIsGood={(v) => v < 0}
            subtitle="申请到退款完成"
            loading={loading.summary}
          />
          <KPICard
            title="客服平均处理时长"
            value={summary?.avgServiceTime || 0}
            unit="分钟"
            trend={summary?.trend.serviceTime}
            trendUnit="分钟"
            trendIsGood={(v) => v < 0}
            subtitle="首次响应到结案"
            loading={loading.summary}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="退货原因分布"
            subtitle="点击色块可快速筛选对应原因"
            sampleSize={summary?.sampleSize}
            infoTooltip="展示各退货原因的数量分布，色块大小代表退货量占比。点击色块可联动筛选查看明细数据。"
            onExport={handleExport}
          >
            <ReasonTreeMap
              data={reasons}
              loading={loading.reasons}
              height={360}
            />
          </ChartCard>

          <ChartCard
            title="退款周期分布"
            subtitle="P50/P90 分位线标注"
            sampleSize={summary?.sampleSize}
            infoTooltip="退款周期从申请提交到退款完成的天数分布。P50 表示中位数，P90 表示 90% 的单据在此天数内完成。"
            onExport={handleExport}
          >
            <CycleHistogram
              data={cycle}
              loading={loading.cycle}
              height={360}
            />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="商品退货排行 TOP10"
            subtitle="红色标注退货量最高的商品"
            sampleSize={summary?.sampleSize}
            infoTooltip="按退货数量排序的前 10 个商品，退货率为该商品退货占总退货的比例。"
            onExport={handleExport}
          >
            <ProductRanking
              data={products}
              loading={loading.products}
              height={360}
            />
          </ChartCard>

          <ChartCard
            title="客服处理效率分析"
            subtitle="处理时长分布 + 人均效率对比"
            sampleSize={summary?.sampleSize}
            infoTooltip="左轴为各时长区间的工单数量，右轴为客服人员的平均处理时长（折线）。"
            onExport={handleExport}
          >
            <ServiceChart
              data={service}
              loading={loading.service}
              height={360}
            />
          </ChartCard>
        </div>

        {cycle && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h4 className="text-sm font-medium text-slate-500 mb-2">各阶段耗时拆解</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">申请 → 质检</span>
                  <span className="font-semibold text-slate-800">{cycle.stageBreakdown.applyToQuality} 天</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (cycle.stageBreakdown.applyToQuality / cycle.stageBreakdown.total) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">质检 → 退款</span>
                  <span className="font-semibold text-slate-800">{cycle.stageBreakdown.qualityToRefund} 天</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-warning-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (cycle.stageBreakdown.qualityToRefund / cycle.stageBreakdown.total) * 100)}%`,
                    }}
                  />
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between">
                  <span className="text-sm font-medium text-slate-700">总计</span>
                  <span className="font-bold text-primary-600">{cycle.stageBreakdown.total} 天</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h4 className="text-sm font-medium text-slate-500 mb-2">退款周期分位数</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">中位数 (P50)</span>
                  <span className="font-semibold text-success-600 text-lg">{cycle.percentiles.p50} 天</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">P90</span>
                  <span className="font-semibold text-warning-600 text-lg">{cycle.percentiles.p90} 天</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">P99</span>
                  <span className="font-semibold text-danger-600 text-lg">{cycle.percentiles.p99} 天</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h4 className="text-sm font-medium text-slate-500 mb-2">重复退货用户</h4>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-display font-semibold text-warning-600">
                  {summary?.repeatUserRate || 0}
                </span>
                <span className="text-sm text-slate-500">%</span>
              </div>
              <p className="text-xs text-slate-500">
                占比基于用户脱敏 hash 计算，同一用户退货次数 ≥ 3 次标记为重复用户。用户真实信息已加密处理，无法反向识别。
              </p>
              <div className="mt-3 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-warning-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-warning-700">
                    所有用户标识均经过 SHA-256 加盐哈希处理，确保隐私合规。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <RecordsTable />

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary-600" />
            <h3 className="font-display text-lg font-semibold text-slate-800">关键指标口径说明</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { metric: "退货率", def: "退货单数量 / 订单数量 × 100%", src: "订单表 + 退货申请表" },
              { metric: "退款周期", def: "退货申请提交到退款完成的天数", src: "退货申请 + 退款表" },
              { metric: "客服处理时长", def: "客服首次响应到结案的分钟数", src: "客服备注表" },
              { metric: "重复退货用户", def: "同一用户（脱敏）退货次数 ≥ 3次", src: "退货申请表（用户Hash）" },
              { metric: "P90 退款周期", def: "升序排列后第90百分位值", src: "退款周期明细" },
              { metric: "数据一致性", def: "关键字段完整率", src: "多表关联校验" },
            ].map((item) => (
              <div key={item.metric} className="p-3 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-700 text-sm">{item.metric}</p>
                <p className="text-xs text-slate-500 mt-1">{item.def}</p>
                <p className="text-xs text-primary-600 mt-1">数据源: {item.src}</p>
              </div>
            ))}
          </div>
        </div>

        <footer className="text-center text-xs text-slate-400 py-4">
          © 2024 电商数据分析平台 · 数据每 5 分钟自动刷新 · 样本量会影响结论可信度
        </footer>
      </main>

      <DetailPanel />
    </div>
  );
}
