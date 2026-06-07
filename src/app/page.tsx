'use client';

import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import type { FilterState } from '@/lib/types';
import {
  loadData,
  getTopicMatrix,
  getPublishHeatmap,
  getInteractionFunnel,
  getTopContents,
  validateMetrics,
  DataCache,
} from '@/lib/etl';
import { getMockData } from '@/lib/mock-data';
import FilterPanel from '@/components/FilterPanel';
import StatCard from '@/components/StatCard';
import TopicMatrixChart from '@/components/TopicMatrixChart';
import PublishHeatmap from '@/components/PublishHeatmap';
import InteractionFunnel from '@/components/InteractionFunnel';
import TopContentsTable from '@/components/TopContentsTable';
import DataInfoBar from '@/components/DataInfoBar';
import EmptyState from '@/components/EmptyState';
import MetricsInfo from '@/components/MetricsInfo';

export default function Dashboard() {
  const [filters, setFilters] = useState<FilterState>({
    accounts: [],
    platforms: [],
    contentTypes: [],
    tags: [],
    authors: [],
    dateRange: [dayjs().subtract(30, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
    timeUnit: 'day',
    excludeAnomaly: false,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMockData();
    setIsLoading(false);
  }, []);

  const processedData = useMemo(() => {
    if (isLoading) return null;
    return loadData(filters);
  }, [filters, isLoading]);

  const allData = useMemo(() => {
    if (isLoading) return [];
    return getMockData();
  }, [isLoading]);

  const availableOptions = useMemo(() => {
    const accounts = new Set<string>();
    const tags = new Set<string>();
    const authors = new Set<string>();

    allData.forEach((item) => {
      accounts.add(item.account);
      item.tags.forEach((t) => tags.add(t));
      authors.add(item.author);
    });

    return {
      accounts: Array.from(accounts).sort(),
      tags: Array.from(tags).sort(),
      authors: Array.from(authors).sort(),
    };
  }, [allData]);

  const topicMatrix = useMemo(() => {
    if (!processedData) return [];
    return getTopicMatrix(processedData.items, 15);
  }, [processedData]);

  const heatmapData = useMemo(() => {
    if (!processedData) return [];
    return getPublishHeatmap(processedData.items);
  }, [processedData]);

  const funnelData = useMemo(() => {
    if (!processedData) return [];
    return getInteractionFunnel(processedData.items);
  }, [processedData]);

  const validation = useMemo(() => {
    if (!processedData) return { valid: true, issues: [] };
    return validateMetrics(processedData.items);
  }, [processedData]);

  const handleTagClick = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags : [...prev.tags, tag],
    }));
  };

  const handleRefresh = () => {
    DataCache.getInstance().clear();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">正在加载数据...</p>
        </div>
      </div>
    );
  }

  const hasData = processedData && processedData.sampleSize > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">内容运营数据复盘</h1>
                <p className="text-xs text-gray-500">新媒体内容分析工作台</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <MetricsInfo />
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                刷新数据
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            availableAccounts={availableOptions.accounts}
            availableTags={availableOptions.tags}
            availableAuthors={availableOptions.authors}
          />

          {processedData && (
            <DataInfoBar
              sampleSize={processedData.sampleSize}
              updateTime={processedData.updateTime}
              filters={filters}
              items={processedData.items}
              validation={validation}
            />
          )}

          {hasData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                  label="内容数量"
                  value={processedData!.sampleSize}
                  subValue="篇内容"
                  color="blue"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                />
                <StatCard
                  label="总曝光量"
                  value={processedData!.totalViews.toLocaleString()}
                  subValue="次曝光"
                  color="purple"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  }
                />
                <StatCard
                  label="总阅读量"
                  value={processedData!.totalReads.toLocaleString()}
                  subValue="次阅读"
                  color="green"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  }
                />
                <StatCard
                  label="总点赞量"
                  value={processedData!.totalLikes.toLocaleString()}
                  subValue="次点赞"
                  color="pink"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  }
                />
                <StatCard
                  label="总互动量"
                  value={(processedData!.totalLikes + processedData!.totalShares + processedData!.totalComments).toLocaleString()}
                  subValue="点赞+转发+评论"
                  color="amber"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  }
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopicMatrixChart data={topicMatrix} />
                <PublishHeatmap data={heatmapData} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InteractionFunnel data={funnelData} />
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">互动转化概览</h3>
                  <div className="space-y-4">
                    {funnelData.slice(1).map((item, index) => {
                      const prev = funnelData[index];
                      const conversionRate = prev.value > 0
                        ? Number(((item.value / prev.value) * 100).toFixed(1))
                        : 0;
                      return (
                        <div key={item.name}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">{prev.name} → {item.name}</span>
                            <span className="font-medium text-gray-900">{conversionRate}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                              style={{ width: `${conversionRate}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-2">平均互动率</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {processedData && processedData.totalViews > 0
                        ? (
                            ((processedData.totalLikes + processedData.totalShares + processedData.totalComments) /
                              processedData.totalViews) *
                            100
                          ).toFixed(2)
                        : 0}
                      %
                    </div>
                  </div>
                </div>
              </div>

              <TopContentsTable items={processedData!.items} onTagClick={handleTagClick} />
            </>
          ) : (
            <EmptyState
              title="暂无数据"
              description="当前筛选条件下没有找到匹配的内容数据，请尝试调整筛选条件或扩大时间范围"
              action={{
                label: '重置筛选条件',
                onClick: () =>
                  setFilters({
                    accounts: [],
                    platforms: [],
                    contentTypes: [],
                    tags: [],
                    authors: [],
                    dateRange: [dayjs().subtract(30, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
                    timeUnit: 'day',
                    excludeAnomaly: false,
                  }),
              }}
            />
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              内容运营数据复盘工作台 · 数据仅供内部分析使用
            </p>
            <p className="text-sm text-gray-400">
              不同平台指标口径存在差异，跨平台对比请谨慎参考
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
