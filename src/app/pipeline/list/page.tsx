'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatRelativeTime, roleLabel } from '@/lib/utils';
import { Phone, MapPin, Ruler, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useState } from 'react';

export default function PipelineListPage() {
  const { leads, stages, tags } = useAppStore();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  const filtered = leads.filter((l) => {
    const matchSearch =
      !search ||
      l.customer_name.includes(search) ||
      l.phone.includes(search) ||
      (l.community && l.community.includes(search));
    const matchStage = !stageFilter || l.stage_id === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Input variant="search" placeholder="搜索客户、电话、小区..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-80" />
              <Select
                options={[{ value: '', label: '全部阶段' }, ...stages.map((s) => ({ value: s.id, label: s.name }))]}
                value={stageFilter}
                onChange={setStageFilter}
                className="w-44"
              />
              <div className="ml-auto">
                <Button variant="outline" size="sm">导出数据</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-5 py-3.5 font-medium">客户信息</th>
                    <th className="px-5 py-3.5 font-medium">小区/面积</th>
                    <th className="px-5 py-3.5 font-medium">预算范围</th>
                    <th className="px-5 py-3.5 font-medium">阶段</th>
                    <th className="px-5 py-3.5 font-medium">标签</th>
                    <th className="px-5 py-3.5 font-medium">负责人</th>
                    <th className="px-5 py-3.5 font-medium">最近更新</th>
                    <th className="px-5 py-3.5 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((l) => {
                    const stage = stages.find((s) => s.id === l.stage_id);
                    const leadTags = tags.filter((t) => l.tags.includes(t.id));
                    return (
                      <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full gradient-card-blue flex items-center justify-center text-white text-sm font-semibold">
                              {l.customer_name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{l.customer_name}</div>
                              <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <Phone className="h-3 w-3" />
                                {l.phone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-gray-700 text-sm flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            {l.community || '-'}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Ruler className="h-3 w-3" />
                            {l.area ? `${l.area}㎡` : '-'}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm text-gray-700 flex items-center gap-1">
                            <Wallet className="h-3.5 w-3.5 text-gray-400" />
                            {l.budget_min ? `${formatCurrency(l.budget_min)} ~ ${formatCurrency(l.budget_max)}` : '-'}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {stage && (
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{ backgroundColor: stage.color + '15', color: stage.color }}
                            >
                              {stage.name}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {leadTags.slice(0, 3).map((t) => (
                              <span
                                key={t.id}
                                className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium"
                                style={{ backgroundColor: t.color + '15', color: t.color }}
                              >
                                {t.name}
                              </span>
                            ))}
                            {leadTags.length > 3 && (
                              <span className="text-[11px] text-gray-400 py-0.5">+{leadTags.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {l.assignee_name ? (
                            <div className="text-sm text-gray-700">{l.assignee_name}</div>
                          ) : (
                            <span className="text-sm text-gray-400">未分配</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-400">{formatRelativeTime(l.updated_at)}</td>
                        <td className="px-5 py-4 text-right">
                          <Link href={`/leads/${l.id}`}>
                            <Button size="sm" variant="ghost">查看详情</Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-gray-400 text-sm">
                <div className="text-4xl mb-2 opacity-30">🔍</div>
                没有找到匹配的线索
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
