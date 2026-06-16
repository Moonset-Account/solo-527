import { createLazyFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useMemo } from 'react';
import { featuresApi } from '../../lib/api';
import type { Feature } from '../../lib/types';

function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isEnabled, setIsEnabled] = useState('');

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const data = await featuresApi.list();
      setFeatures(data.features);
    } catch (error) {
      console.error('Failed to fetch features:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeatures = useMemo(() => {
    return features.filter((feature) => {
      if (search && !feature.name.toLowerCase().includes(search.toLowerCase()) &&
          !feature.featureKey.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (isEnabled !== '' && String(feature.isEnabled) !== isEnabled) {
        return false;
      }
      return true;
    });
  }, [features, search, isEnabled]);

  const handleToggle = async (feature: Feature) => {
    try {
      await featuresApi.toggle(feature.featureKey, !feature.isEnabled);
      fetchFeatures();
    } catch (error) {
      console.error('Failed to toggle feature:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">功能开关管理</h1>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="搜索功能名称或标识..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={isEnabled}
              onChange={(e) => setIsEnabled(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部状态</option>
              <option value="true">启用</option>
              <option value="false">停用</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">名称</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">标识</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">描述</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">更新时间</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeatures.map((feature) => (
                    <tr key={feature.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">{feature.name}</td>
                      <td className="py-3 px-4">
                        <code className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-mono">
                          {feature.featureKey}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs">
                        <div className="truncate" title={feature.description}>
                          {feature.description || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            feature.isEnabled
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {feature.isEnabled ? '启用' : '停用'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(feature.updatedAt)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggle(feature)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            feature.isEnabled ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              feature.isEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                共 {filteredFeatures.length} 条记录
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const Route = createLazyFileRoute('/admin/features')({
  component: FeaturesPage,
});
