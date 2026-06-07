"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TagDistributionChart } from "@/components/charts/TagDistributionChart";
import { trpc } from "@/lib/trpc/client";
import { useFilterStore } from "@/store/filterStore";
import { Tags, TrendingUp, TrendingDown } from "lucide-react";

export default function TagsPage() {
  const { dateRange, teamIds } = useFilterStore();

  const { data: tagDistribution = [] } = trpc.dashboard.getTagDistribution.useQuery({
    dateRange,
  });

  const total = tagDistribution.reduce((sum, t) => sum + t.count, 0);
  const topTag = tagDistribution[0];

  const categories = Array.from(
    new Set(tagDistribution.map((t) => t.category).filter(Boolean))
  );

  return (
    <DashboardLayout title="标签分布" subtitle="分析会话问题类型分布，优化知识库">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-primary-50">
                <Tags className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">标签总数</p>
                <p className="text-2xl font-bold font-mono text-neutral-800">
                  {tagDistribution.length}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-success-50">
                <TrendingUp className="w-5 h-5 text-success-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">总会话量</p>
                <p className="text-2xl font-bold font-mono text-neutral-800">
                  {total.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-warning-50">
                <Tags className="w-5 h-5 text-warning-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Top 问题</p>
                <p className="text-2xl font-bold text-neutral-800 truncate max-w-[120px]">
                  {topTag?.tagName}
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-500">
              占比 {topTag?.percentage.toFixed(1)}%
            </p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-purple-50">
                <TrendingDown className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">问题分类</p>
                <p className="text-2xl font-bold font-mono text-neutral-800">
                  {categories.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <TagDistributionChart data={tagDistribution} />
          </div>
          <div className="card">
            <h3 className="text-base font-semibold text-neutral-800 mb-4">标签明细</h3>
            <div className="space-y-2 max-h-[420px] overflow-y-auto scrollbar-thin pr-2">
              {tagDistribution.map((tag, idx) => (
                <div
                  key={tag.tagName}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-neutral-800">
                        {tag.tagName}
                      </span>
                      <span className="text-sm font-mono text-neutral-600">
                        {tag.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400"
                        style={{ width: `${tag.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-neutral-500 w-12 text-right">
                    {tag.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
