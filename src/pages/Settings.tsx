import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import Modal from '@/components/Modal';
import type { ContractTemplate, SettlementRule, AppointmentSlotConfig, WorkflowNodeConfig } from '@/types';

const mockTemplates: ContractTemplate[] = [
  { id: 1, name: '标准租赁合同', content: '', fields: ['owner_name', 'tenant_name'], isActive: true, createdAt: '2026-01-01', updatedAt: '2026-06-01' },
  { id: 2, name: '短租协议', content: '', fields: ['owner_name', 'tenant_name'], isActive: true, createdAt: '2026-03-01', updatedAt: '2026-05-15' },
];

const mockRules: SettlementRule[] = [
  { id: 1, name: '标准月结', projectType: '长租公寓', cycle: 'monthly', ratio: 0.95, isActive: true, createdAt: '2026-01-01', updatedAt: '2026-06-01' },
  { id: 2, name: '季度结算', projectType: '高端公寓', cycle: 'quarterly', ratio: 0.92, isActive: true, createdAt: '2026-02-01', updatedAt: '2026-05-01' },
];

const mockSlots: AppointmentSlotConfig[] = [
  { id: 1, dayOfWeek: 1, startTime: '09:00', endTime: '12:00', interval: 60, isActive: true },
  { id: 2, dayOfWeek: 1, startTime: '14:00', endTime: '18:00', interval: 60, isActive: true },
  { id: 3, dayOfWeek: 6, startTime: '10:00', endTime: '16:00', interval: 90, isActive: true },
  { id: 4, dayOfWeek: 0, startTime: '10:00', endTime: '14:00', interval: 60, isActive: false },
];

const mockNodes: WorkflowNodeConfig[] = [
  { id: 1, processType: 'contract', nodeName: '业主签署', nodeOrder: 1, approverRole: '业主', isRequired: true, isActive: true },
  { id: 2, processType: 'contract', nodeName: '租客签署', nodeOrder: 2, approverRole: '租客', isRequired: true, isActive: true },
  { id: 3, processType: 'settlement', nodeName: '财务审批', nodeOrder: 1, approverRole: '财务', isRequired: true, isActive: true },
  { id: 4, processType: 'appointment', nodeName: '顾问确认', nodeOrder: 1, approverRole: '顾问', isRequired: false, isActive: true },
];

const tabs = [
  { key: 'templates', label: '合同模板' },
  { key: 'rules', label: '结算规则' },
  { key: 'slots', label: '预约时段' },
  { key: 'nodes', label: '工作流节点' },
] as const;

type TabKey = typeof tabs[number]['key'];

const dayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const cycleLabels: Record<string, string> = { monthly: '月结', quarterly: '季结', yearly: '年结' };
const processLabels: Record<string, string> = { contract: '合同', settlement: '结算', appointment: '预约' };

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabKey>('templates');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<{ type: string; data: Record<string, unknown> } | null>(null);

  const openCreate = () => {
    setEditItem(null);
    setShowModal(true);
  };

  const openEdit = (type: string, data: Record<string, unknown>) => {
    setEditItem({ type, data });
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-[#F1F5F9]">配置中心</h2>

      <div className="flex border-b border-[#334155]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'text-[#F97316] border-b-2 border-[#F97316]' : 'text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={openCreate} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA580C]">
          <Plus size={16} /> 新增
        </button>
      </div>

      {activeTab === 'templates' && (
        <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">模板名称</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">字段数</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">状态</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">更新时间</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {mockTemplates.map((t) => (
                <tr key={t.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/30">
                  <td className="px-4 py-3 text-[#F1F5F9]">{t.name}</td>
                  <td className="px-4 py-3 text-[#CBD5E1]">{t.fields.length}个</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${t.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {t.isActive ? '启用' : '停用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#CBD5E1]">{t.updatedAt}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit('template', t as unknown as Record<string, unknown>)} className="text-[#F97316] hover:underline text-sm flex items-center gap-1">
                      <Pencil size={14} /> 编辑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">规则名称</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">项目类型</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">结算周期</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">分成比例</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">状态</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {mockRules.map((r) => (
                <tr key={r.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/30">
                  <td className="px-4 py-3 text-[#F1F5F9]">{r.name}</td>
                  <td className="px-4 py-3 text-[#CBD5E1]">{r.projectType}</td>
                  <td className="px-4 py-3 text-[#CBD5E1]">{cycleLabels[r.cycle]}</td>
                  <td className="px-4 py-3 text-[#F97316]">{(r.ratio * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${r.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {r.isActive ? '启用' : '停用'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit('rule', r as unknown as Record<string, unknown>)} className="text-[#F97316] hover:underline text-sm flex items-center gap-1">
                      <Pencil size={14} /> 编辑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'slots' && (
        <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">星期</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">开始时间</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">结束时间</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">间隔(分钟)</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">状态</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {mockSlots.map((s) => (
                <tr key={s.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/30">
                  <td className="px-4 py-3 text-[#F1F5F9]">{dayLabels[s.dayOfWeek]}</td>
                  <td className="px-4 py-3 text-[#CBD5E1]">{s.startTime}</td>
                  <td className="px-4 py-3 text-[#CBD5E1]">{s.endTime}</td>
                  <td className="px-4 py-3 text-[#CBD5E1]">{s.interval}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${s.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {s.isActive ? '启用' : '停用'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit('slot', s as unknown as Record<string, unknown>)} className="text-[#F97316] hover:underline text-sm flex items-center gap-1">
                      <Pencil size={14} /> 编辑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'nodes' && (
        <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">流程类型</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">节点名称</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">顺序</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">审批角色</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">必填</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">状态</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {mockNodes.map((n) => (
                <tr key={n.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/30">
                  <td className="px-4 py-3 text-[#F1F5F9]">{processLabels[n.processType]}</td>
                  <td className="px-4 py-3 text-[#CBD5E1]">{n.nodeName}</td>
                  <td className="px-4 py-3 text-[#CBD5E1]">{n.nodeOrder}</td>
                  <td className="px-4 py-3 text-[#CBD5E1]">{n.approverRole}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${n.isRequired ? 'text-amber-400' : 'text-[#64748B]'}`}>
                      {n.isRequired ? '必填' : '可选'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${n.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {n.isActive ? '启用' : '停用'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit('node', n as unknown as Record<string, unknown>)} className="text-[#F97316] hover:underline text-sm flex items-center gap-1">
                      <Pencil size={14} /> 编辑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="编辑配置" width="max-w-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">名称</label>
            <input className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none" placeholder="输入名称" />
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">状态</label>
            <select className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none">
              <option value="true" className="bg-[#0F172A]">启用</option>
              <option value="false" className="bg-[#0F172A]">停用</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm text-[#94A3B8] hover:bg-[#334155]">取消</button>
            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA580C]">保存</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
