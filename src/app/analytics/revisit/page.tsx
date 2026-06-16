'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { BarChart3, AlertTriangle, Clock, User, ChevronDown, ChevronUp, RefreshCw, MessageCircle, Phone, FileText } from 'lucide-react';
import Link from 'next/link';

export default function RevisitPage() {
  const { revisitRecords, leads, users } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalProcessHours = revisitRecords.reduce((s, r) => s + r.total_process_hours, 0);
  const avgConsult = revisitRecords.length > 0 ? (revisitRecords.reduce((s, r) => s + r.consult_count, 0) / revisitRecords.length).toFixed(1) : '0';

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="grid grid-cols-4 gap-5">
          {[
            { title: '重复咨询客户', value: revisitRecords.length, icon: AlertTriangle, gradient: 'gradient-card-orange', suffix: '人' },
            { title: '累计咨询次数', value: revisitRecords.reduce((s, r) => s + r.consult_count, 0), icon: MessageCircle, gradient: 'gradient-card-blue', suffix: '次' },
            { title: '平均咨询次数', value: avgConsult, icon: RefreshCw, gradient: 'gradient-card-purple', suffix: '次/人' },
            { title: '累计处理耗时', value: Math.round(totalProcessHours / 24), icon: Clock, gradient: 'gradient-card-green', suffix: '天' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="overflow-hidden border-0 text-white shadow-card-hover animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className={s.gradient}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm text-white/70">{s.title}</div>
                        <div className="text-2xl font-bold mt-2 font-mono tracking-tight">
                          {s.value}{s.suffix}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary-500" />
                客户重复咨询分析
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">详细记录重复咨询原因、处理耗时及责任人，方便追溯和交接</p>
            </div>
            <Button variant="outline" size="sm">导出报表</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-5 py-3.5 font-medium w-10"></th>
                    <th className="px-5 py-3.5 font-medium">客户</th>
                    <th className="px-5 py-3.5 font-medium">咨询次数</th>
                    <th className="px-5 py-3.5 font-medium">首次咨询</th>
                    <th className="px-5 py-3.5 font-medium">最近咨询</th>
                    <th className="px-5 py-3.5 font-medium">平均间隔</th>
                    <th className="px-5 py-3.5 font-medium">处理耗时</th>
                    <th className="px-5 py-3.5 font-medium">责任人</th>
                    <th className="px-5 py-3.5 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {revisitRecords.map((r) => {
                    const lead = leads.find((l) => l.id === r.lead_id);
                    const expanded = expandedId === r.id;
                    return (
                      <>
                        <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <button onClick={() => setExpandedId(expanded ? null : r.id)}>
                              {expanded ? (
                                <ChevronUp className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full gradient-card-orange flex items-center justify-center text-white text-sm font-semibold">
                                {lead?.customer_name.slice(0, 1) || '?'}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{lead?.customer_name || '未知'}</div>
                                <div className="text-xs text-gray-400 mt-0.5">{r.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={r.consult_count >= 3 ? 'danger' : 'warning'} dot>
                              {r.consult_count} 次
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-gray-600 text-xs">{formatDateTime(r.first_consult_at)}</td>
                          <td className="px-5 py-4 text-gray-600 text-xs">{formatDateTime(r.last_consult_at)}</td>
                          <td className="px-5 py-4">
                            <span className="text-sm font-mono text-gray-700">{Math.round(r.avg_interval_hours / 24)} 天</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm font-mono text-gray-700">{Math.round(r.total_process_hours / 24)} 天</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full gradient-card-blue flex items-center justify-center text-white text-[10px] font-semibold">
                                {r.current_owner_name?.slice(0, 1)}
                              </div>
                              <span className="text-sm text-gray-700">{r.current_owner_name || '未分配'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            {lead && (
                              <Link href={`/leads/${lead.id}`}>
                                <Button size="sm" variant="ghost">查看详情</Button>
                              </Link>
                            )}
                          </td>
                        </tr>
                        {expanded && (
                          <tr className="bg-gray-50/50 border-b border-gray-100">
                            <td colSpan={9} className="px-5 py-4">
                              <div className="pl-8 space-y-4 animate-slide-down">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm font-medium text-gray-700">重复咨询原因分析：</span>
                                </div>
                                <div className="flex flex-wrap gap-2 pl-6">
                                  {r.reasons.map((reason: string, i: number) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100 text-xs font-medium"
                                    >
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      {reason}
                                    </span>
                                  ))}
                                </div>
                                <div className="grid grid-cols-4 gap-4 pl-6 pt-2">
                                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                                    <div className="text-xs text-gray-400 mb-1">首次响应时长</div>
                                    <div className="text-sm font-semibold text-gray-800 font-mono">2 小时 15 分</div>
                                  </div>
                                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                                    <div className="text-xs text-gray-400 mb-1">平均跟进间隔</div>
                                    <div className="text-sm font-semibold text-gray-800 font-mono">{Math.round(r.avg_interval_hours / 24)} 天</div>
                                  </div>
                                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                                    <div className="text-xs text-gray-400 mb-1">当前阶段</div>
                                    <div className="text-sm font-semibold text-gray-800">
                                      {lead?.stage_id ? '跟进中' : '公海池'}
                                    </div>
                                  </div>
                                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                                    <div className="text-xs text-gray-400 mb-1">预算范围</div>
                                    <div className="text-sm font-semibold text-gray-800 font-mono">
                                      {lead ? formatCurrency(lead.budget_min) + ' - ' + formatCurrency(lead.budget_max) : '-'}
                                    </div>
                                  </div>
                                </div>
                                <div className="pl-6">
                                  <div className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                                    <User className="h-3 w-3" />
                                    处理交接记录
                                  </div>
                                  <div className="relative">
                                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
                                    <div className="space-y-2">
                                      <div className="relative pl-6">
                                        <div className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-orange-400" />
                                        <div className="text-xs text-gray-500">2025-06-10 14:30 · 首次录入系统</div>
                                      </div>
                                      <div className="relative pl-6">
                                        <div className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-primary-400" />
                                        <div className="text-xs text-gray-500">2025-06-12 09:15 · 分配给 {r.current_owner_name} 跟进</div>
                                      </div>
                                      <div className="relative pl-6">
                                        <div className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-gray-400" />
                                        <div className="text-xs text-gray-500">客户二次咨询，标注原因：「对比其他公司」</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
