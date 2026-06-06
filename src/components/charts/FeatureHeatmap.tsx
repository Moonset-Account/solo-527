import React, { useState } from 'react';
import { FeatureUsage } from '../../types';
import { BarChart3, TrendingUp, TrendingDown, Users, Clock, Zap, Filter } from 'lucide-react';

interface FeatureHeatmapProps {
  data: FeatureUsage[];
}

const FeatureHeatmap: React.FC<FeatureHeatmapProps> = ({ data }) => {
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'users' | 'sessions' | 'adoptionRate'>('users');

  const modules = ['all', ...Array.from(new Set(data.map((d) => d.module)))];

  const filteredData = data
    .filter((d) => selectedModule === 'all' || d.module === selectedModule)
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const maxUsers = Math.max(...data.map((d) => d.users));
  const maxSessions = Math.max(...data.map((d) => d.sessions));

  const moduleColors: Record<string, string> = {
    '项目管理': 'bg-blue-500',
    '数据分析': 'bg-purple-500',
    '团队协作': 'bg-green-500',
    '文件存储': 'bg-orange-500',
    '集成中心': 'bg-pink-500',
    '设置': 'bg-gray-500',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">功能热度分析</h3>
          <p className="text-sm text-gray-500 mt-1">各功能模块的使用情况和渗透率</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m === 'all' ? '全部模块' : m}
                </option>
              ))}
            </select>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="users">按用户数</option>
            <option value="sessions">按会话数</option>
            <option value="adoptionRate">按渗透率</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '总功能数', value: data.length, icon: BarChart3, color: 'text-blue-600 bg-blue-50' },
          { label: '总使用用户', value: Math.round(data.reduce((a, b) => a + b.users, 0) / data.length).toLocaleString(), icon: Users, color: 'text-green-600 bg-green-50' },
          { label: '平均渗透率', value: `${Math.round(data.reduce((a, b) => a + b.adoptionRate, 0) / data.length)}%`, icon: Zap, color: 'text-purple-600 bg-purple-50' },
          { label: '平均使用时长', value: `${Math.round(data.reduce((a, b) => a + b.avgDuration, 0) / data.length / 60)} 分钟`, icon: Clock, color: 'text-orange-600 bg-orange-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-50 rounded-lg p-4">
            <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center mb-2`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div className="text-xs text-gray-500">{stat.label}</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {filteredData.map((feature, idx) => (
          <div
            key={feature.id}
            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-xs font-medium text-gray-600">
                  {idx + 1}
                </span>
                <div>
                  <div className="font-medium text-gray-800 group-hover:text-primary-600 transition-colors">
                    {feature.name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${moduleColors[feature.module]}`} />
                    <span className="text-xs text-gray-500">{feature.module}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {feature.trend >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    feature.trend >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {feature.trend >= 0 ? '+' : ''}
                  {feature.trend}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>使用用户</span>
                  <span className="font-medium text-gray-700">{feature.users.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${(feature.users / maxUsers) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>会话数</span>
                  <span className="font-medium text-gray-700">{feature.sessions.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${(feature.sessions / maxSessions) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>渗透率</span>
                  <span className="font-medium text-gray-700">{feature.adoptionRate}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${feature.adoptionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureHeatmap;
