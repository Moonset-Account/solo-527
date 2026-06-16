'use client';

import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/lib/store';
import {
  cn,
  formatDateTime,
  changeTypeLabel,
  changeTypeColor,
  methodLabel,
  formatCurrency,
} from '@/lib/utils';
import {
  ArrowLeft,
  AlertCircle,
  History,
  Phone,
  MessageSquare,
  Home,
  FileText,
  UserPlus,
  RotateCcw,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function TimelinePage() {
  const params = useParams();
  const { leads, stages, changeLogs, followUps, surveys, currentUser } = useAppStore();

  const lead = leads.find((l) => l.id === params.id);

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <AlertCircle className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-lg">线索不存在</p>
          <Link href="/pipeline" className="mt-4 text-primary-500 hover:underline">返回线索列表</Link>
        </div>
      </DashboardLayout>
    );
  }

  const stage = stages.find((s) => s.id === lead.stage_id);
  const leadChanges = changeLogs.filter((c) => c.lead_id === lead.id);
  const leadFollowUps = followUps.filter((f) => f.lead_id === lead.id);
  const leadSurveys = surveys.filter((s) => s.lead_id === lead.id);

  type TimelineEvent = {
    id: string;
    time: string;
    type: 'change' | 'followup' | 'survey';
    data: any;
  };

  const events: TimelineEvent[] = [
    ...leadChanges.map((c) => ({ id: c.id, time: c.changed_at, type: 'change' as const, data: c })),
    ...leadFollowUps.map((f) => ({ id: f.id, time: f.follow_up_time, type: 'followup' as const, data: f })),
    ...leadSurveys.map((s) => ({ id: s.id, time: s.survey_time, type: 'survey' as const, data: s })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const methodIcon: Record<string, any> = { phone: Phone, wechat: MessageSquare, visit: Home };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/pipeline">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">
                {lead.customer_name} · 全流程时间轴
              </h2>
              {stage && (
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: stage.color + '15', color: stage.color }}
                >
                  {stage.name}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">
              线索创建于 {formatDateTime(lead.created_at)} · 共 {events.length} 条操作记录
            </div>
          </div>
          <Link href={`/leads/${lead.id}`}>
            <Button variant="outline">查看详情页</Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-4 gap-4 mb-8 pb-6 border-b border-gray-100">
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">客户电话</div>
                <div className="text-sm font-semibold text-gray-800">{lead.phone}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">小区/面积</div>
                <div className="text-sm font-semibold text-gray-800">{lead.community} · {lead.area}㎡</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">预算范围</div>
                <div className="text-sm font-semibold text-gray-800">
                  {formatCurrency(lead.budget_min)} - {formatCurrency(lead.budget_max)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">负责人</div>
                <div className="text-sm font-semibold text-gray-800">{lead.assignee_name || '未分配'}</div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-[22px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary-200 via-gray-200 to-gray-200" />

              <div className="space-y-5">
                {events.map((e, i) => {
                  if (e.type === 'change') {
                    const c = e.data;
                    const isStageChange = c.change_type === 'stage_change';
                    const isCreate = c.change_type === 'create';
                    const isAssign = c.change_type === 'assign';
                    const isRecycle = c.change_type === 'recycle';

                    return (
                      <div key={e.id} className="relative pl-14 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                        <div
                          className={cn(
                            'absolute left-0 top-1 w-11 h-11 rounded-full flex items-center justify-center z-10 border-4 border-white',
                            isCreate
                              ? 'bg-blue-500'
                              : isStageChange
                              ? 'bg-purple-500'
                              : isAssign
                              ? 'bg-amber-500'
                              : isRecycle
                              ? 'bg-red-500'
                              : 'bg-gray-400'
                          )}
                        >
                          {isCreate ? (
                            <Sparkles className="h-5 w-5 text-white" />
                          ) : isStageChange ? (
                            <ArrowRight className="h-5 w-5 text-white" />
                          ) : isAssign ? (
                            <UserPlus className="h-5 w-5 text-white" />
                          ) : isRecycle ? (
                            <RotateCcw className="h-5 w-5 text-white" />
                          ) : (
                            <History className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn('text-xs px-2 py-0.5 rounded-full border', changeTypeColor(c.change_type))}>
                              {changeTypeLabel(c.change_type)}
                            </span>
                            <span className="text-sm font-medium text-gray-700">{c.changed_by_name}</span>
                            <span className="text-xs text-gray-400 ml-auto">{formatDateTime(e.time)}</span>
                          </div>
                          {isCreate ? (
                            <div className="text-sm text-gray-600">
                              创建线索：{lead.customer_name}（{lead.phone}）
                              {lead.community && ` · ${lead.community}`}
                            </div>
                          ) : isStageChange ? (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 line-through">{c.old_value}</span>
                              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                              <span className="px-2 py-0.5 rounded bg-green-50 text-green-600 font-medium">{c.new_value}</span>
                            </div>
                          ) : isAssign ? (
                            <div className="text-sm text-gray-700">
                              负责人变更：<span className="font-medium">{c.new_value || '未分配'}</span>
                            </div>
                          ) : isRecycle ? (
                            <div className="text-sm text-red-600">线索已回收至公海池</div>
                          ) : c.field ? (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-400">{c.field}</span>
                              {c.old_value !== undefined && (
                                <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 text-xs line-through">
                                  {typeof c.old_value === 'string' ? c.old_value : JSON.stringify(c.old_value)}
                                </span>
                              )}
                              {c.old_value !== undefined && c.new_value !== undefined && (
                                <ChevronRight className="h-3 w-3 text-gray-300" />
                              )}
                              {c.new_value !== undefined && (
                                <span className="px-2 py-0.5 rounded bg-green-50 text-green-600 text-xs font-medium">
                                  {typeof c.new_value === 'string' ? c.new_value : JSON.stringify(c.new_value)}
                                </span>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  }

                  if (e.type === 'followup') {
                    const f = e.data;
                    const Icon = methodIcon[f.method] || MessageSquare;
                    return (
                      <div key={e.id} className="relative pl-14 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="absolute left-0 top-1 w-11 h-11 rounded-full bg-primary-500 flex items-center justify-center z-10 border-4 border-white">
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="info">{methodLabel(f.method)}跟进</Badge>
                            <span className="text-sm font-medium text-gray-700">{f.created_by_name}</span>
                            <span className="text-xs text-gray-400 ml-auto">{formatDateTime(e.time)}</span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{f.content}</p>
                          {f.next_follow_up_at && (
                            <div className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 inline-flex items-center gap-1">
                              📅 下次跟进：{formatDateTime(f.next_follow_up_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (e.type === 'survey') {
                    const s = e.data;
                    return (
                      <div key={e.id} className="relative pl-14 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="absolute left-0 top-1 w-11 h-11 rounded-full bg-purple-500 flex items-center justify-center z-10 border-4 border-white">
                          <Home className="h-5 w-5 text-white" />
                        </div>
                        <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="purple">量房完成</Badge>
                            <span className="text-sm font-medium text-gray-700">{s.surveyor_name}</span>
                            <span className="text-xs text-gray-400 ml-auto">{formatDateTime(e.time)}</span>
                          </div>
                          <div className="flex gap-2 mb-2">
                            {s.photos.slice(0, 4).map((p: string, i: number) => (
                              <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                                <img src={p} alt="" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                          {s.customer_notes && (
                            <div className="text-sm text-gray-600 bg-white/60 rounded-lg px-3 py-2">
                              💬 {s.customer_notes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}

                {events.length === 0 && (
                  <div className="text-center py-16 text-gray-400">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    暂无操作记录
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
