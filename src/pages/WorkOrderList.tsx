import { useState } from 'react';
import { Plus, Star } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import type { WorkOrder } from '@/types';

const mockWorkOrders: WorkOrder[] = [
  { id: 1, type: 'repair', roomId: 1, roomName: '望京SOHO-A1201', tenantId: 1, tenantName: '张先生', assigneeId: 1, assigneeName: '维修师傅A', status: 'pending', description: '水龙头漏水', followUpResult: '', satisfaction: 0, createdAt: '2026-06-16', completedAt: '' },
  { id: 2, type: 'clean', roomId: 2, roomName: '中关村-B0803', tenantId: 2, tenantName: '李女士', assigneeId: 2, assigneeName: '保洁员B', status: 'in_progress', description: '退租保洁', followUpResult: '', satisfaction: 0, createdAt: '2026-06-15', completedAt: '' },
  { id: 3, type: 'followup', roomId: 1, roomName: '望京SOHO-A1201', tenantId: 1, tenantName: '张先生', assigneeId: 1, assigneeName: '顾问A', status: 'completed', description: '维修后回访', followUpResult: '租客满意', satisfaction: 5, createdAt: '2026-06-14', completedAt: '2026-06-14' },
  { id: 4, type: 'inspect', roomId: 3, roomName: '望京SOHO-A1203', tenantId: 3, tenantName: '王先生', assigneeId: 3, assigneeName: '巡检员C', status: 'pending', description: '季度巡检', followUpResult: '', satisfaction: 0, createdAt: '2026-06-16', completedAt: '' },
  { id: 5, type: 'repair', roomId: 4, roomName: '朝阳区-C0502', tenantId: 4, tenantName: '赵女士', assigneeId: 1, assigneeName: '维修师傅A', status: 'closed', description: '空调不制冷', followUpResult: '已修复', satisfaction: 4, createdAt: '2026-06-10', completedAt: '2026-06-11' },
];

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'repair', label: '维修' },
  { value: 'clean', label: '保洁' },
  { value: 'inspect', label: '巡检' },
  { value: 'followup', label: '回访' },
];

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'closed', label: '已关闭' },
];

const typeLabels: Record<string, string> = { repair: '维修', clean: '保洁', inspect: '巡检', followup: '回访' };

export default function WorkOrderList() {
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [followUpResult, setFollowUpResult] = useState('');
  const [satisfaction, setSatisfaction] = useState(5);

  const filtered = mockWorkOrders.filter((w) => {
    if (typeFilter && w.type !== typeFilter) return false;
    if (statusFilter && w.status !== statusFilter) return false;
    if (assigneeSearch && !w.assigneeName.includes(assigneeSearch)) return false;
    return true;
  });

  const openFollowUp = (order: WorkOrder) => {
    setSelectedOrder(order);
    setFollowUpResult('');
    setSatisfaction(5);
    setShowFollowUp(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-[#F1F5F9]">派工回访</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA580C] transition-colors"
        >
          <Plus size={16} /> 新建派工
        </button>
      </div>

      <div className="flex items-center gap-3">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-[#1E293B] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none">
          {typeOptions.map((o) => <option key={o.value} value={o.value} className="bg-[#1E293B]">{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#1E293B] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none">
          {statusOptions.map((o) => <option key={o.value} value={o.value} className="bg-[#1E293B]">{o.label}</option>)}
        </select>
        <input
          type="text" placeholder="搜索负责人" value={assigneeSearch} onChange={(e) => setAssigneeSearch(e.target.value)}
          className="bg-[#1E293B] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none placeholder:text-[#64748B] w-40"
        />
      </div>

      <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">类型</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">房源</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">租客</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">负责人</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">描述</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">状态</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <tr key={w.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/30">
                <td className="px-4 py-3 text-[#CBD5E1]">{typeLabels[w.type]}</td>
                <td className="px-4 py-3 text-[#CBD5E1]">{w.roomName}</td>
                <td className="px-4 py-3 text-[#CBD5E1]">{w.tenantName}</td>
                <td className="px-4 py-3 text-[#CBD5E1]">{w.assigneeName}</td>
                <td className="px-4 py-3 text-[#CBD5E1] max-w-[200px] truncate">{w.description}</td>
                <td className="px-4 py-3"><StatusBadge status={w.status} /></td>
                <td className="px-4 py-3">
                  {(w.status === 'completed' || w.status === 'closed') && w.type !== 'followup' && !w.followUpResult && (
                    <button onClick={() => openFollowUp(w)} className="text-xs text-[#F97316] hover:underline">
                      回访
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新建派工">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">类型</label>
            <select className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none">
              {typeOptions.filter(o => o.value).map((o) => <option key={o.value} value={o.value} className="bg-[#0F172A]">{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">房源</label>
            <select className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none">
              <option value="" className="bg-[#0F172A]">选择房源</option>
              <option value="1" className="bg-[#0F172A]">望京SOHO-A1201</option>
              <option value="2" className="bg-[#0F172A]">中关村-B0803</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">描述</label>
            <textarea className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none resize-none h-20" placeholder="输入问题描述" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm text-[#94A3B8] hover:bg-[#334155]">取消</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA580C]">确认创建</button>
          </div>
        </div>
      </Modal>

      <Modal open={showFollowUp} onClose={() => setShowFollowUp(false)} title="回访记录">
        <div className="space-y-4">
          {selectedOrder && (
            <div className="p-3 rounded-lg bg-[#0F172A] border border-[#334155]">
              <p className="text-sm text-[#94A3B8]">{selectedOrder.roomName} - {selectedOrder.description}</p>
            </div>
          )}
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">满意度评分</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <button key={v} onClick={() => setSatisfaction(v)} className="p-0.5">
                  <Star size={24} className={v <= satisfaction ? 'text-amber-400 fill-amber-400' : 'text-[#475569]'} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">回访结果</label>
            <textarea
              value={followUpResult}
              onChange={(e) => setFollowUpResult(e.target.value)}
              className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none resize-none h-20"
              placeholder="输入回访结果"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowFollowUp(false)} className="px-4 py-2 rounded-lg text-sm text-[#94A3B8] hover:bg-[#334155]">取消</button>
            <button onClick={() => setShowFollowUp(false)} className="px-4 py-2 rounded-lg bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA580C]">提交回访</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
