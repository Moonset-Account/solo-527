'use client';

import { useState } from 'react';
import type { ContentItem } from '@/lib/types';
import { PLATFORM_LABELS, CONTENT_TYPE_LABELS } from '@/lib/types';

interface TopContentsTableProps {
  items: ContentItem[];
  onTagClick: (tag: string) => void;
}

type SortField = 'views' | 'likes' | 'shares' | 'comments' | 'interactionRate';
type SortOrder = 'asc' | 'desc';

export default function TopContentsTable({ items, onTagClick }: TopContentsTableProps) {
  const [sortField, setSortField] = useState<SortField>('views');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [showOnlyAnomaly, setShowOnlyAnomaly] = useState(false);

  const displayItems = showOnlyAnomaly ? items.filter((i) => i.isAnomaly) : items;

  const getInteractionRate = (item: ContentItem) => {
    return item.views > 0
      ? Number((((item.likes + item.shares + item.comments) / item.views) * 100).toFixed(2))
      : 0;
  };

  const getSortValue = (item: ContentItem, field: SortField): number => {
    if (field === 'interactionRate') {
      return getInteractionRate(item);
    }
    return item[field] as number;
  };

  const sortedItems = [...displayItems].sort((a, b) => {
    const aVal = getSortValue(a, sortField);
    const bVal = getSortValue(b, sortField);
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && (
          <span className="text-blue-600">
            {sortOrder === 'desc' ? '↓' : '↑'}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">爆款内容拆解</h3>
            <p className="text-sm text-gray-500 mt-1">
              共 {displayItems.length} 条内容，点击可查看明细
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyAnomaly}
              onChange={(e) => setShowOnlyAnomaly(e.target.checked)}
              className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">只看异常数据</span>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                标题
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                平台/类型
              </th>
              <SortHeader field="views" label="曝光量" />
              <SortHeader field="likes" label="点赞" />
              <SortHeader field="shares" label="转发" />
              <SortHeader field="comments" label="评论" />
              <SortHeader field="interactionRate" label="互动率" />
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                标签
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedItems.slice(0, 20).map((item) => (
              <tr
                key={item.id}
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                  item.isAnomaly ? 'bg-amber-50' : ''
                }`}
                onClick={() => setSelectedItem(item)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {item.isAnomaly && (
                      <span
                        className="w-2 h-2 rounded-full bg-amber-500"
                        title={item.anomalyReason}
                      />
                    )}
                    <div className="text-sm text-gray-900 font-medium truncate max-w-xs">
                      {item.title}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-700">
                    {PLATFORM_LABELS[item.platform]}
                  </div>
                  <div className="text-xs text-gray-500">
                    {CONTENT_TYPE_LABELS[item.contentType]}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {item.views.toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {item.likes.toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {item.shares.toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {item.comments.toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      getInteractionRate(item) >= 5
                        ? 'bg-emerald-100 text-emerald-800'
                        : getInteractionRate(item) >= 3
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {getInteractionRate(item)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 2).map((tag) => (
                      <button
                        key={tag}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTagClick(tag);
                        }}
                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                    {item.tags.length > 2 && (
                      <span className="px-2 py-0.5 text-xs text-gray-400">
                        +{item.tags.length - 2}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedItem && (
        <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

function DetailModal({ item, onClose }: { item: ContentItem; onClose: () => void }) {
  const interactionRate =
    item.views > 0
      ? Number((((item.likes + item.shares + item.comments) / item.views) * 100).toFixed(2))
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">内容明细</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {item.isAnomaly && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">数据异常</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">{item.anomalyReason}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">标题</h4>
            <p className="text-gray-900 font-medium">{item.title}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoItem label="ID" value={item.id} />
            <InfoItem label="账号" value={item.account} />
            <InfoItem label="平台" value={PLATFORM_LABELS[item.platform]} />
            <InfoItem label="内容类型" value={CONTENT_TYPE_LABELS[item.contentType]} />
            <InfoItem label="作者" value={item.author} />
            <InfoItem label="发布时间" value={item.publishTime} />
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">核心指标</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MetricCard label="曝光量" value={item.views.toLocaleString()} color="blue" />
              <MetricCard label="阅读量" value={item.reads.toLocaleString()} color="indigo" />
              <MetricCard label="点赞" value={item.likes.toLocaleString()} color="pink" />
              <MetricCard label="转发" value={item.shares.toLocaleString()} color="green" />
              <MetricCard label="评论" value={item.comments.toLocaleString()} color="amber" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">选题标签</h4>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">互动率</h4>
              <div className="text-2xl font-bold text-gray-900">{interactionRate}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    pink: 'bg-pink-50 text-pink-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className={`p-3 rounded-lg ${colorClasses[color] || colorClasses.blue}`}>
      <div className="text-xs opacity-75 mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
