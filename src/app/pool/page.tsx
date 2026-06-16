'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useAppStore } from '@/lib/store';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';
import { Building2, MapPin, UserPlus, RotateCcw, CheckSquare, Square, Phone } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export default function PoolPage() {
  const { leads, stages, users, batchAssignFromPool, recycleLeadToPool, currentUser } = useAppStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignee, setAssignee] = useState('');
  const [search, setSearch] = useState('');

  const poolStage = stages.find((s) => s.order === 0);
  const assignStage = stages.find((s) => s.order === 1);

  const poolLeads = leads.filter(
    (l) =>
      (l.is_in_pool || l.stage_id === poolStage?.id || l.stage_id === assignStage?.id) &&
      (!search ||
        l.customer_name.includes(search) ||
        l.phone.includes(search) ||
        (l.community && l.community.includes(search)))
  );

  const consultants = users.filter((u) => u.role === 'sales_consultant' && u.is_active);

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (selected.length === poolLeads.length) {
      setSelected([]);
    } else {
      setSelected(poolLeads.map((l) => l.id));
    }
  };

  const handleBatchAssign = () => {
    if (selected.length > 0 && assignee) {
      batchAssignFromPool(selected, assignee);
      setSelected([]);
      setAssignee('');
      setAssignOpen(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <Card className="gradient-card-blue text-white border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">公海池</h3>
                  <p className="text-white/70 text-sm mt-0.5">
                    当前 {poolLeads.length} 条线索等待分配 · 批量分发提高效率
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<UserPlus className="h-4 w-4" />}
                  onClick={() => selected.length > 0 && setAssignOpen(true)}
                  disabled={selected.length === 0}
                  className="bg-white/15 text-white hover:bg-white/25 border-0"
                >
                  批量分配 ({selected.length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Input variant="search" placeholder="搜索客户、电话、小区..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-80" />
              <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-1.5 hover:text-gray-700 transition-colors"
                >
                  {selected.length === poolLeads.length && poolLeads.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-primary-500" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  全选
                </button>
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
                    <th className="px-5 py-3.5 w-10"></th>
                    <th className="px-5 py-3.5 font-medium">客户信息</th>
                    <th className="px-5 py-3.5 font-medium">小区/面积</th>
                    <th className="px-5 py-3.5 font-medium">预算范围</th>
                    <th className="px-5 py-3.5 font-medium">状态</th>
                    <th className="px-5 py-3.5 font-medium">录入时间</th>
                    <th className="px-5 py-3.5 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {poolLeads.map((l) => {
                    const stage = stages.find((s) => s.id === l.stage_id);
                    return (
                      <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <button onClick={() => toggleSelect(l.id)}>
                            {selected.includes(l.id) ? (
                              <CheckSquare className="h-4 w-4 text-primary-500" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-300" />
                            )}
                          </button>
                        </td>
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
                          <div className="text-xs text-gray-400 mt-0.5">{l.area ? `${l.area}㎡` : '-'}</div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700">
                          {l.budget_min ? `${formatCurrency(l.budget_min)} ~ ${formatCurrency(l.budget_max)}` : '-'}
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
                        <td className="px-5 py-4 text-xs text-gray-400">{formatRelativeTime(l.created_at)}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              leftIcon={<UserPlus className="h-3.5 w-3.5" />}
                              onClick={() => {
                                setSelected([l.id]);
                                setAssignOpen(true);
                              }}
                            >
                              分配
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {poolLeads.length === 0 && (
              <div className="py-16 text-center text-gray-400 text-sm">
                <div className="text-4xl mb-2 opacity-30">🌊</div>
                公海池暂无线索
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title={`批量分配线索 (${selected.length}条)`}
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>取消</Button>
            <Button onClick={handleBatchAssign}>确认分配</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">选择销售顾问</label>
            <Select
              options={consultants.map((u) => ({ value: u.id, label: u.name }))}
              value={assignee}
              onChange={setAssignee}
              placeholder="请选择负责人"
            />
          </div>
          <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            分配后线索将自动进入「跟进中」阶段
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
