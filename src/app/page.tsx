'use client';

import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import type { FilterState, PlatformAggregatedMetrics } from '@/lib/types';
import {
  loadData,
  getTopicMatrix,
  getPublishHeatmap,
  getPlatformInteractionFunnel,
  validateMetrics,
  DataCache,
  getPlatformAggregatedMetrics,
} from '@/lib/etl';
import { getMockData } from '@/lib/mock-data';
import FilterPanel from '@/components/FilterPanel';
import StatCard from '@/components/StatCard';
import TopicMatrixChart from '@/components/TopicMatrixChart';
import PublishHeatmap from '@/components/PublishHeatmap';
import PlatformFunnelChart from '@/components/PlatformFunnelChart';
import TopContentsTable from '@/components/TopContentsTable';
import DataInfoBar from '@/components/DataInfoBar';
import EmptyState from '@/components/EmptyState';
import MetricsInfo from '@/components/MetricsInfo';

const initialAllData = getMockData();

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

  const processedData = useMemo(() => loadData(filters), [filters]);

  const allData = useMemo(() => initialAllData, []);

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
    return getTopicMatrix(processedData.items, 15);
  }, [processedData]);

  const heatmapData = useMemo(() => {
    return getPublishHeatmap(processedData.items);
  }, [processedData]);

  const platformFunnelData = useMemo(() => {
    return getPlatformInteractionFunnel(processedData.items);
  }, [processedData]);

  const platformMetrics = useMemo(() => {
    return getPlatformAggregatedMetrics(processedData.items);
  }, [processedData]);

  const validation = useMemo(() => {
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
    window.location.reload();
  };

  const totalInteractions = useMemo(() => {
    return platformMetrics.reduce(
      (sum, p) => sum + p.likes + p.shares + p.comments,
      0
    );
  }, [platformMetrics]);

  const avgInteractionRate = useMemo(() => {
    const totalPrimary = platformMetrics.reduce((sum, p) => sum + p.primaryMetricTotal, 0);
    return totalPrimary > 0
      ? Number(((totalInteractions / totalPrimary) * 100).toFixed(2))
      : 0;
  }, [platformMetrics, totalInteractions]);

  const hasData = processedData.sampleSize > 0;

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
                <p className="text-xs text-gray-500">新媒体内容分析工作台 · 按平台分口径统计</p>
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

          <DataInfoBar
            sampleSize={processedData.sampleSize}
            updateTime={processedData.updateTime}
            filters={filters}
            items={processedData.items}
            validation={validation}
          />

          {hasData ? (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">各平台核心指标（分口径统计）</h3>
                <p className="text-sm text-gray-500 mb-4">
                  微信公众号使用「阅读量」为核心指标，抖音/B站使用「播放量」，微博/小红书使用「曝光量」
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <StatCard
                    label="内容总数"
                    value={processedData.sampleSize}
                    subValue="篇内容"
                    color="blue"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    }
                  />
                  {platformMetrics.slice(0, 4).map((metric) => (
                    <PlatformMetricCard key={metric.platform} metric={metric} />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopicMatrixChart data={topicMatrix} />
                <PublishHeatmap data={heatmapData} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PlatformFunnelChart data={platformFunnelData} />
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">平台互动转化对比</h3>
                  <div className="space-y-5">
                    {platformMetrics.map((metric) => (
                      <div key={metric.platform}>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-medium text-gray-700">{metric.platformLabel}</span>
                          <span className="text-gray-500">
                            核心指标: {metric.primaryMetricName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">互动率</span>
                          <span className="font-semibold text-blue-600">{metric.avgInteractionRate}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                            style={{ width: `${Math.min(metric.avgInteractionRate * 10, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>{metric.primaryMetricTotal.toLocaleString()} {metric.primaryMetricName}</span>
                          <span>{(metric.likes + metric.shares + metric.comments).toLocaleString()} 互动</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">加权平均互动率</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {avgInteractionRate}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      基于各平台核心口径加权计算
                    </div>
                  </div>
                </div>
              </div>

              <TopContentsTable items={processedData.items} onTagClick={handleTagClick} />
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
              各平台指标已按口径隔离，无跨平台直接求和
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PlatformMetricCard({ metric }: { metric: PlatformAggregatedMetrics }) {
  const colorMap: Record<string, 'blue' | 'green' | 'purple' | 'amber' | 'pink'> = {
    wechat: 'green',
    weibo: 'amber',
    douyin: 'pink',
    xiaohongshu: 'purple',
    bilibili: 'blue',
  };

  const iconMap: Record<string, React.ReactNode> = {
    wechat: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.11.24-.245 0-.06-.023-.12-.04-.178l-.327-1.233a.49.49 0 01.177-.554C23.107 18.423 24 16.74 24 14.9c0-3.21-2.931-5.847-6.656-6.048zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z" />
      </svg>
    ),
    weibo: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.194.573zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.57-.18-.405-.649.353-1.017.389-1.894.003-2.522-.727-1.186-2.745-1.121-5.061-.033 0 0-.726.326-.539-.281.359-1.207.304-2.217-.27-2.79-1.313-1.315-4.803.049-7.792 3.049C1.39 11.808 0 14.032 0 15.941c0 3.486 4.264 5.617 8.476 5.617 5.705 0 9.585-3.394 9.585-6.089 0-1.613-1.363-2.53-2.502-2.72zm3.742-6.442c-1.21-1.323-2.974-2.034-4.859-1.992a.726.726 0 00-.708.836.731.731 0 00.838.622c1.35-.03 2.622.474 3.49 1.428.856.942 1.196 2.183.958 3.365a.731.731 0 00.637.815.728.728 0 00.816-.634c.308-1.52-.133-3.142-1.172-4.44zm-2.033-.851c-.602-.658-1.482-1.013-2.428-.993a.614.614 0 00-.6.705.616.616 0 00.706.6c.67-.013 1.293.22 1.72.688.434.475.608 1.104.487 1.704a.615.615 0 00.536.686.614.614 0 00.686-.533c.162-.806-.071-1.662-.507-2.257z" />
      </svg>
    ),
    douyin: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 01-5.201 1.743l-.002-.001a2.895 2.895 0 013.183-4.51v-3.5a6.329 6.329 0 00-5.394 10.692 6.33 6.33 0 0010.857-4.424V8.697a8.215 8.215 0 004.773 1.526V6.79a4.831 4.831 0 01-.901-.104z" />
      </svg>
    ),
    xiaohongshu: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
    ),
    bilibili: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 01-.373-.906c0-.356.124-.659.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44v-.027c.116.115.207.254.271.416.064.162.096.334.096.516 0 .356-.124.658-.373.907l-1.174 1.12h6.906l-1.174-1.12a1.234 1.234 0 01-.373-.906c0-.356.124-.659.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .662.129.944.39l2.174 2.08zm.214 2.014H5.333c-.996.071-1.812.488-2.448 1.25-.636.763-.998 1.718-1.086 2.867v7.36c.088 1.149.45 2.104 1.086 2.867.636.762 1.452 1.179 2.448 1.25h13.334c.996-.071 1.817-.488 2.46-1.25.644-.763 1.008-1.718 1.094-2.867v-7.36c-.086-1.15-.45-2.105-1.093-2.867-.645-.763-1.465-1.179-2.462-1.25zM8 10.72c.373 0 .684.124.933.373.249.249.373.569.373.96v2.227c0 .391-.124.707-.373.956-.249.249-.56.373-.933.373-.391 0-.711-.124-.96-.373-.25-.249-.374-.565-.374-.956V12.05c0-.391.125-.711.373-.96.249-.249.569-.373.96-.373zm8 0c.373 0 .684.124.933.373.249.249.373.569.373.96v2.227c0 .391-.124.707-.373.956-.249.249-.56.373-.933.373-.391 0-.711-.124-.96-.373-.25-.249-.374-.565-.374-.956V12.05c0-.391.125-.711.373-.96.249-.249.569-.373.96-.373z" />
      </svg>
    ),
  };

  return (
    <StatCard
      label={`${metric.platformLabel}${metric.primaryMetricName}`}
      value={metric.primaryMetricTotal.toLocaleString()}
      subValue={`${metric.sampleSize}篇内容`}
      color={colorMap[metric.platform] || 'blue'}
      icon={iconMap[metric.platform] || iconMap.wechat}
    />
  );
}
