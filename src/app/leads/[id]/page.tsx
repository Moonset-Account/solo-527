'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useAppStore } from '@/lib/store';
import {
  cn,
  formatCurrency,
  formatDateTime,
  formatRelativeTime,
  formatFileSize,
  methodLabel,
  changeTypeLabel,
  changeTypeColor,
} from '@/lib/utils';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Ruler,
  Wallet,
  Palette,
  Share2,
  UserPlus,
  RotateCcw,
  Calendar,
  Clock,
  Plus,
  Download,
  FileText,
  Image as ImageIcon,
  Phone as PhoneIcon,
  MessageSquare,
  Home,
  MoreHorizontal,
  ChevronRight,
  AlertCircle,
  History,
  Paperclip,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { FOLLOWUP_METHODS } from '@/lib/constants';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const {
    leads,
    stages,
    tags,
    followUps,
    surveys,
    attachments,
    changeLogs,
    users,
    updateLeadStage,
    assignLead,
    recycleLeadToPool,
    addFollowUp,
    currentUser,
  } = useAppStore();

  const lead = leads.find((l) => l.id === params.id);
  const [assignOpen, setAssignOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [newStage, setNewStage] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [followUpMethod, setFollowUpMethod] = useState('phone');
  const [followUpContent, setFollowUpContent] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <AlertCircle className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-lg">线索不存在</p>
          <Link href="/pipeline" className="mt-4 text-primary-500 hover:underline">
            返回线索列表
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const stage = stages.find((s) => s.id === lead.stage_id);
  const leadTags = tags.filter((t) => lead.tags.includes(t.id));
  const leadFollowUps = followUps.filter((f) => f.lead_id === lead.id).sort(
    (a, b) => new Date(b.follow_up_time).getTime() - new Date(a.follow_up_time).getTime()
  );
  const leadSurveys = surveys.filter((s) => s.lead_id === lead.id);
  const leadAttachments = attachments.filter((a) => a.lead_id === lead.id);
  const leadChanges = changeLogs.filter((c) => c.lead_id === lead.id).sort(
    (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );

  const handleAssign = () => {
    if (newAssignee) {
      assignLead(lead.id, newAssignee);
      setAssignOpen(false);
      setNewAssignee('');
    }
  };

  const handleAddFollowUp = () => {
    if (followUpContent.trim() && currentUser) {
      addFollowUp({
        lead_id: lead.id,
        follow_up_time: new Date().toISOString(),
        method: followUpMethod as any,
        content: followUpContent,
        next_follow_up_at: nextFollowUp || undefined,
        created_by: currentUser.id,
        created_by_name: currentUser.name,
      });
      setFollowUpOpen(false);
      setFollowUpContent('');
      setNextFollowUp('');
    }
  };

  const methodIcon: Record<string, any> = {
    phone: PhoneIcon,
    wechat: MessageSquare,
    visit: Home,
    other: MoreHorizontal,
  };

  const consultants = users.filter((u) => u.role === 'sales_consultant' && u.is_active);

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
              <h2 className="text-xl font-bold text-gray-900">{lead.customer_name}</h2>
              {stage && (
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: stage.color + '15', color: stage.color }}
                >
                  {stage.name}
                </span>
              )}
              {lead.auto_recycle_at && <Badge variant="danger" dot>即将回收</Badge>}
            </div>
            <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-3">
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{lead.phone}</span>
              <span>创建于 {formatDateTime(lead.created_at)}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" leftIcon={<Share2 className="h-4 w-4" />}>分享</Button>
          <Button variant="outline" size="sm" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => recycleLeadToPool(lead.id)}>
            回收公海
          </Button>
          <Button size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setAssignOpen(true)}>
            {lead.assignee_name ? '转派' : '分配'}
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-5">
          <Card className="col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
                <div className="w-14 h-14 rounded-2xl gradient-card-blue flex items-center justify-center text-white text-xl font-bold">
                  {lead.customer_name.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">{lead.customer_name}</div>
                  <div className="text-sm text-gray-500">{lead.phone}</div>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-gray-400">所在小区</div>
                    <div className="text-sm font-medium text-gray-800 mt-0.5">{lead.community || '-'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Ruler className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-gray-400">房屋面积</div>
                    <div className="text-sm font-medium text-gray-800 mt-0.5">{lead.area ? `${lead.area}㎡` : '-'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Wallet className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-gray-400">预算范围</div>
                    <div className="text-sm font-medium text-gray-800 mt-0.5">
                      {lead.budget_min ? `${formatCurrency(lead.budget_min)} ~ ${formatCurrency(lead.budget_max)}` : '-'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Palette className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-gray-400">装修风格</div>
                    <div className="text-sm font-medium text-gray-800 mt-0.5">{lead.style || '-'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Share2 className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-gray-400">来源渠道</div>
                    <div className="text-sm font-medium text-gray-800 mt-0.5">{lead.source || '-'}</div>
                  </div>
                </div>
              </div>

              {leadTags.length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <div className="text-xs text-gray-400 mb-2">客户标签</div>
                  <div className="flex flex-wrap gap-1.5">
                    {leadTags.map((t) => (
                      <span
                        key={t.id}
                        className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: t.color + '15', color: t.color }}
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {lead.remark && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <div className="text-xs text-gray-400 mb-2">备注</div>
                  <div className="text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
                    {lead.remark}
                  </div>
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="text-xs text-gray-400 mb-2">阶段快速切换</div>
                <div className="flex flex-wrap gap-1.5">
                  {stages
                    .filter((s) => s.is_active)
                    .sort((a, b) => a.order - b.order)
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() => updateLeadStage(lead.id, s.id)}
                        className={cn(
                          'px-2 py-1 rounded-md text-[11px] font-medium transition-all border',
                          s.id === lead.stage_id
                            ? 'border-transparent text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                        )}
                        style={s.id === lead.stage_id ? { backgroundColor: s.color } : {}}
                      >
                        {s.name}
                      </button>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardContent className="p-5 pt-0">
              <div className="flex items-center justify-between py-4 border-b border-gray-100 -mx-5 px-5 mb-0">
                <Tabs defaultValue="followups" className="w-full">
                  <div className="flex items-center justify-between">
                    <TabsList>
                      <TabsTrigger value="followups">
                        <History className="h-3.5 w-3.5 mr-1.5" />
                        跟进记录 <Badge variant="default" className="ml-1.5 h-4 text-[10px]">{leadFollowUps.length}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="surveys">
                        <Home className="h-3.5 w-3.5 mr-1.5" />
                        量房信息 <Badge variant="default" className="ml-1.5 h-4 text-[10px]">{leadSurveys.length}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="attachments">
                        <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                        合同附件 <Badge variant="default" className="ml-1.5 h-4 text-[10px]">{leadAttachments.length}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="changes">
                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                        变更历史 <Badge variant="default" className="ml-1.5 h-4 text-[10px]">{leadChanges.length}</Badge>
                      </TabsTrigger>
                    </TabsList>
                    <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFollowUpOpen(true)}>
                      新增跟进
                    </Button>
                  </div>

                  <TabsContent value="followups" className="mt-5">
                    {leadFollowUps.length === 0 ? (
                      <div className="text-center py-16 text-gray-400">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>暂无跟进记录，点击右上角按钮添加</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200" />
                        <div className="space-y-5">
                          {leadFollowUps.map((f) => {
                            const Icon = methodIcon[f.method] || MessageSquare;
                            return (
                              <div key={f.id} className="relative pl-10">
                                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                                  <Icon className="h-3.5 w-3.5 text-primary-500" />
                                </div>
                                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-card">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="info">{methodLabel(f.method)}</Badge>
                                      <span className="text-sm font-medium text-gray-800">{f.created_by_name}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">{formatDateTime(f.follow_up_time)}</span>
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed">{f.content}</p>
                                  {f.next_follow_up_at && (
                                    <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-amber-600 flex items-center gap-1.5">
                                      <Calendar className="h-3.5 w-3.5" />
                                      下次跟进：{formatDateTime(f.next_follow_up_at)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="surveys" className="mt-5">
                    {leadSurveys.length === 0 ? (
                      <div className="text-center py-16 text-gray-400">
                        <Home className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>暂无量房记录</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {leadSurveys.map((s) => (
                          <div key={s.id} className="border border-gray-100 rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg gradient-card-purple flex items-center justify-center text-white text-xs font-semibold">
                                  {s.surveyor_name?.slice(0, 1)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-800">{s.surveyor_name}</div>
                                  <div className="text-xs text-gray-400">{formatDateTime(s.survey_time)}</div>
                                </div>
                              </div>
                            </div>
                            <div className="p-4">
                              {s.photos.length > 0 && (
                                <div className="mb-4">
                                  <div className="text-xs text-gray-400 mb-2">现场照片</div>
                                  <div className="flex gap-2 flex-wrap">
                                    {s.photos.map((p, i) => (
                                      <div key={i} className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 relative group">
                                        <img src={p} alt="" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                          <ImageIcon className="h-5 w-5 text-white" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {Object.keys(s.measurements).length > 0 && (
                                <div className="mb-4">
                                  <div className="text-xs text-gray-400 mb-2">测量数据</div>
                                  <div className="grid grid-cols-4 gap-2">
                                    {Object.entries(s.measurements).map(([k, v]) => (
                                      <div key={k} className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                                        <div className="text-xs text-gray-400">{k}</div>
                                        <div className="text-sm font-semibold text-gray-800 mt-0.5 font-mono">{v}㎡</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {s.customer_notes && (
                                <div>
                                  <div className="text-xs text-gray-400 mb-2">客户备注</div>
                                  <div className="text-sm text-gray-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                                    {s.customer_notes}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="attachments" className="mt-5">
                    {leadAttachments.length === 0 ? (
                      <div className="text-center py-16 text-gray-400">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>暂无合同附件</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {leadAttachments.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                              <FileText className="h-5 w-5 text-primary-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">{a.file_name}</div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {a.file_type || '未知类型'} · {formatFileSize(a.file_size)} · 上传者 {a.uploaded_by_name} · {formatDateTime(a.created_at)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700">
                                <Download className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="changes" className="mt-5">
                    {leadChanges.length === 0 ? (
                      <div className="text-center py-16 text-gray-400">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>暂无变更记录</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200" />
                        <div className="space-y-4">
                          {leadChanges.map((c) => (
                            <div key={c.id} className="relative pl-10">
                              <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center z-10">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{
                                    backgroundColor:
                                      c.change_type === 'stage_change'
                                        ? '#8B5CF6'
                                        : c.change_type === 'assign'
                                        ? '#F59E0B'
                                        : c.change_type === 'recycle'
                                        ? '#EF4444'
                                        : c.change_type === 'create'
                                        ? '#3B82F6'
                                        : '#9CA3AF',
                                  }}
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={cn('text-xs px-2 py-0.5 rounded-full border', changeTypeColor(c.change_type))}>
                                    {changeTypeLabel(c.change_type)}
                                  </span>
                                  <span className="text-sm font-medium text-gray-700">{c.changed_by_name}</span>
                                  <span className="text-xs text-gray-400">{formatDateTime(c.changed_at)}</span>
                                </div>
                                {c.field && (
                                  <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                                    <span className="text-gray-400">{c.field}</span>
                                    {c.old_value !== undefined && (
                                      <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 text-xs line-through">
                                        {typeof c.old_value === 'string' ? c.old_value : JSON.stringify(c.old_value)}
                                      </span>
                                    )}
                                    <ChevronRight className="h-3 w-3 text-gray-300" />
                                    {c.new_value !== undefined && (
                                      <span className="px-2 py-0.5 rounded bg-green-50 text-green-600 text-xs">
                                        {typeof c.new_value === 'string' ? c.new_value : JSON.stringify(c.new_value)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title={lead.assignee_name ? '转派线索' : '分配线索'}
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>取消</Button>
            <Button onClick={handleAssign}>确认{lead.assignee_name ? '转派' : '分配'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">选择销售顾问</label>
            <Select
              options={consultants.map((u) => ({ value: u.id, label: u.name }))}
              value={newAssignee}
              onChange={setNewAssignee}
              placeholder="请选择负责人"
            />
          </div>
          <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            分配后线索将自动进入「跟进中」阶段，并通知对应销售顾问
          </div>
        </div>
      </Modal>

      <Modal
        open={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        title="新增跟进记录"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setFollowUpOpen(false)}>取消</Button>
            <Button onClick={handleAddFollowUp} leftIcon={<Send className="h-4 w-4" />}>保存记录</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">跟进方式</label>
            <div className="grid grid-cols-4 gap-2">
              {FOLLOWUP_METHODS.map((m) => {
                const Icon = methodIcon[m.value] || MessageSquare;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setFollowUpMethod(m.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-xl border transition-all',
                      followUpMethod === m.value
                        ? 'border-primary-400 bg-primary-50 text-primary-600 ring-2 ring-primary-100'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">跟进内容 *</label>
            <textarea
              rows={5}
              value={followUpContent}
              onChange={(e) => setFollowUpContent(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none text-sm resize-none"
              placeholder="请记录本次跟进的详细内容..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">下次跟进时间</label>
            <input
              type="datetime-local"
              value={nextFollowUp}
              onChange={(e) => setNextFollowUp(e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none text-sm"
            />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
