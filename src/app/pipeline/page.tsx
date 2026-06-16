'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';
import { GripVertical, MoreHorizontal, User, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';

export default function PipelinePage() {
  const { leads, stages, tags, updateLeadStage, currentUser } = useAppStore();
  const [search, setSearch] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  const canMove = currentUser?.role === 'super_admin' || currentUser?.role === 'sales_manager';

  const filteredLeads = leads.filter(
    (l) =>
      !search ||
      l.customer_name.includes(search) ||
      l.phone.includes(search) ||
      (l.community && l.community.includes(search))
  );

  const getStageLeads = (stageId: string) =>
    filteredLeads
      .filter((l) => l.stage_id === stageId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!canMove) {
      e.preventDefault();
      return;
    }
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setOverStage(stageId);
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedId && canMove) {
      updateLeadStage(draggedId, stageId);
    }
    setDraggedId(null);
    setOverStage(null);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div className="flex items-center gap-3">
            <Input
              variant="search"
              placeholder="搜索客户、电话、小区..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-80"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">筛选条件</Button>
            <Link href="/pipeline/list">
              <Button variant="outline" size="sm">列表视图</Button>
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto scrollbar-thin -mx-6 px-6 pb-2">
          <div className="flex gap-4 h-full min-w-max">
            {stages
              .filter((s) => s.is_active)
              .sort((a, b) => a.order - b.order)
              .map((stage) => {
                const stageLeads = getStageLeads(stage.id);
                const isOver = overStage === stage.id;
                return (
                  <div
                    key={stage.id}
                    className={cn(
                      'w-72 shrink-0 flex flex-col rounded-2xl transition-all duration-200',
                      isOver ? 'bg-gray-100/80 ring-2 ring-primary-300' : 'bg-gray-50/80'
                    )}
                    onDragOver={(e) => handleDragOver(e, stage.id)}
                    onDragLeave={() => setOverStage(null)}
                    onDrop={(e) => handleDrop(e, stage.id)}
                  >
                    <div className="px-3.5 py-3 shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: stage.color }}
                          />
                          <span className="text-sm font-semibold text-gray-800">{stage.name}</span>
                          <Badge variant="default" className="text-[10px] h-5 bg-white">{stageLeads.length}</Badge>
                        </div>
                        <button className="p-1 rounded-md hover:bg-white text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-3 space-y-2.5">
                      {stageLeads.map((lead) => {
                        const leadTags = tags.filter((t) => lead.tags.includes(t.id));
                        const isDragging = draggedId === lead.id;
                        return (
                          <Link
                            key={lead.id}
                            href={`/leads/${lead.id}`}
                            draggable={canMove}
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                            onDragEnd={() => {
                              setDraggedId(null);
                              setOverStage(null);
                            }}
                            className={cn(
                              'block bg-white rounded-xl p-3.5 shadow-card hover:shadow-card-hover transition-all duration-200',
                              'border border-gray-100 hover:border-gray-200 group',
                              isDragging && 'opacity-50 scale-[0.98] rotate-[0.5deg]',
                              canMove && 'cursor-grab active:cursor-grabbing'
                            )}
                            style={{ borderLeft: `3px solid ${stage.color}` }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  {canMove && (
                                    <GripVertical className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 -ml-1" />
                                  )}
                                  <span className="font-semibold text-gray-900 text-sm">{lead.customer_name}</span>
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 ml-4">
                                  <Phone className="h-3 w-3" />
                                  {lead.phone}
                                </div>
                              </div>
                              <div className="w-7 h-7 rounded-full gradient-card-blue flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
                                {lead.assignee_name?.slice(0, 1) || '?'}
                              </div>
                            </div>

                            {lead.community && (
                              <div className="text-xs text-gray-500 flex items-center gap-1 mb-2 ml-4">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                {lead.community}
                              </div>
                            )}

                            <div className="ml-4">
                              <div className="text-[11px] text-gray-400 mb-1.5">
                                {lead.area ? `${lead.area}㎡` : ''}
                                {lead.budget_min ? ` · ${formatCurrency(lead.budget_min)}-${formatCurrency(lead.budget_max)}` : ''}
                              </div>

                              {leadTags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {leadTags.slice(0, 3).map((t) => (
                                    <span
                                      key={t.id}
                                      className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium"
                                      style={{ backgroundColor: t.color + '15', color: t.color }}
                                    >
                                      {t.name}
                                    </span>
                                  ))}
                                  {leadTags.length > 3 && (
                                    <span className="text-[10px] text-gray-400">+{leadTags.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50 ml-4">
                              <span className="text-[10px] text-gray-400">{formatRelativeTime(lead.updated_at)}</span>
                              {lead.auto_recycle_at && (
                                <Badge variant="danger" className="text-[9px] h-4">即将回收</Badge>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                      {stageLeads.length === 0 && (
                        <div className="text-center py-10 text-xs text-gray-400">
                          <div className="text-3xl mb-2 opacity-30">📭</div>
                          暂无线索
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
