import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { useContractStore } from '@/stores/contractStore';
import { useSettlementStore } from '@/stores/settlementStore';
import { useConfigStore } from '@/stores/configStore';
import type { ContractTemplate, SettlementRule, AppointmentSlotConfig, WorkflowNodeConfig } from '@/types';

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
  const [modalType, setModalType] = useState<'template' | 'rule' | 'slot' | 'node'>('template');
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const { templates, templatesLoading, fetchTemplates, createTemplate, updateTemplate, deleteTemplate } = useContractStore();
  const { rules, rulesLoading, fetchRules, createRule, updateRule, deleteRule } = useSettlementStore();
  const { slots, slotsLoading, fetchSlots, createSlot, updateSlot, deleteSlot } = useConfigStore();
  const { workflowNodes, nodesLoading, fetchWorkflowNodes, createWorkflowNode, updateWorkflowNode, deleteWorkflowNode } = useConfigStore();

  const [templateForm, setTemplateForm] = useState({ name: '', content: '', fields: '', isActive: true });
  const [ruleForm, setRuleForm] = useState<{ name: string; projectType: string; cycle: 'monthly' | 'quarterly' | 'yearly'; ratio: number; isActive: boolean }>({ name: '', projectType: '', cycle: 'monthly', ratio: 0.95, isActive: true });
  const [slotForm, setSlotForm] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '18:00', interval: 60, isActive: true });
  const [nodeForm, setNodeForm] = useState<{ processType: 'contract' | 'settlement' | 'appointment'; nodeName: string; nodeOrder: number; approverRole: string; isRequired: boolean; isActive: boolean }>({ processType: 'contract', nodeName: '', nodeOrder: 1, approverRole: '', isRequired: false, isActive: true });

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    } else if (activeTab === 'rules') {
      fetchRules();
    } else if (activeTab === 'slots') {
      fetchSlots();
    } else if (activeTab === 'nodes') {
      fetchWorkflowNodes();
    }
  }, [activeTab, fetchTemplates, fetchRules, fetchSlots, fetchWorkflowNodes]);

  const openCreate = () => {
    setEditingItem(null);
    if (activeTab === 'templates') {
      setModalType('template');
      setTemplateForm({ name: '', content: '', fields: '', isActive: true });
    } else if (activeTab === 'rules') {
      setModalType('rule');
      setRuleForm({ name: '', projectType: '', cycle: 'monthly', ratio: 0.95, isActive: true });
    } else if (activeTab === 'slots') {
      setModalType('slot');
      setSlotForm({ dayOfWeek: 1, startTime: '09:00', endTime: '18:00', interval: 60, isActive: true });
    } else if (activeTab === 'nodes') {
      setModalType('node');
      setNodeForm({ processType: 'contract', nodeName: '', nodeOrder: 1, approverRole: '', isRequired: false, isActive: true });
    }
    setShowModal(true);
  };

  const openEdit = (type: string, item: unknown) => {
    setEditingItem((item as { id: number }).id);
    if (type === 'template') {
      const t = item as ContractTemplate;
      setModalType('template');
      setTemplateForm({ name: t.name, content: t.content, fields: t.fields.join(','), isActive: t.isActive });
    } else if (type === 'rule') {
      const r = item as SettlementRule;
      setModalType('rule');
      setRuleForm({ name: r.name, projectType: r.projectType, cycle: r.cycle, ratio: r.ratio, isActive: r.isActive });
    } else if (type === 'slot') {
      const s = item as AppointmentSlotConfig;
      setModalType('slot');
      setSlotForm({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, interval: s.interval, isActive: s.isActive });
    } else if (type === 'node') {
      const n = item as WorkflowNodeConfig;
      setModalType('node');
      setNodeForm({ processType: n.processType, nodeName: n.nodeName, nodeOrder: n.nodeOrder, approverRole: n.approverRole, isRequired: n.isRequired, isActive: n.isActive });
    }
    setShowModal(true);
  };

  const handleDelete = async (type: string, id: number) => {
    if (!confirm('确定要删除吗？')) return;
    let success = false;
    if (type === 'template') {
      success = await deleteTemplate(id);
    } else if (type === 'rule') {
      success = await deleteRule(id);
    } else if (type === 'slot') {
      success = await deleteSlot(id);
    } else if (type === 'node') {
      success = await deleteWorkflowNode(id);
    }
    if (success) {
      if (activeTab === 'templates') fetchTemplates();
      else if (activeTab === 'rules') fetchRules();
      else if (activeTab === 'slots') fetchSlots();
      else if (activeTab === 'nodes') fetchWorkflowNodes();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    let success = false;

    if (modalType === 'template') {
      const data = {
        name: templateForm.name,
        content: templateForm.content,
        fields: templateForm.fields.split(',').map(f => f.trim()).filter(Boolean),
        isActive: templateForm.isActive,
      };
      if (editingItem) {
        success = await updateTemplate(editingItem, data);
      } else {
        success = await createTemplate(data);
      }
    } else if (modalType === 'rule') {
      const data = {
        name: ruleForm.name,
        projectType: ruleForm.projectType,
        cycle: ruleForm.cycle,
        ratio: Number(ruleForm.ratio),
        isActive: ruleForm.isActive,
      };
      if (editingItem) {
        success = await updateRule(editingItem, data);
      } else {
        success = await createRule(data);
      }
    } else if (modalType === 'slot') {
      const data = {
        dayOfWeek: Number(slotForm.dayOfWeek),
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        interval: Number(slotForm.interval),
        isActive: slotForm.isActive,
      };
      if (editingItem) {
        success = await updateSlot(editingItem, data);
      } else {
        success = await createSlot(data);
      }
    } else if (modalType === 'node') {
      const data = {
        processType: nodeForm.processType,
        nodeName: nodeForm.nodeName,
        nodeOrder: Number(nodeForm.nodeOrder),
        approverRole: nodeForm.approverRole,
        isRequired: nodeForm.isRequired,
        isActive: nodeForm.isActive,
      };
      if (editingItem) {
        success = await updateWorkflowNode(editingItem, data);
      } else {
        success = await createWorkflowNode(data);
      }
    }

    setSaving(false);
    if (success) {
      setShowModal(false);
      if (activeTab === 'templates') fetchTemplates();
      else if (activeTab === 'rules') fetchRules();
      else if (activeTab === 'slots') fetchSlots();
      else if (activeTab === 'nodes') fetchWorkflowNodes();
    }
  };

  const isLoading = () => {
    switch (activeTab) {
      case 'templates': return templatesLoading;
      case 'rules': return rulesLoading;
      case 'slots': return slotsLoading;
      case 'nodes': return nodesLoading;
    }
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
          {templatesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-[#F97316]" />
            </div>
          ) : (
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
                {templates.map((t) => (
                  <tr key={t.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/30">
                    <td className="px-4 py-3 text-[#F1F5F9]">{t.name}</td>
                    <td className="px-4 py-3 text-[#CBD5E1]">{t.fields.length}个</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${t.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {t.isActive ? '启用' : '停用'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#CBD5E1]">{t.updatedAt || t.createdAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit('template', t)} className="text-[#F97316] hover:underline text-sm flex items-center gap-1">
                          <Pencil size={14} /> 编辑
                        </button>
                        <button onClick={() => handleDelete('template', t.id)} className="text-rose-400 hover:underline text-sm flex items-center gap-1">
                          <Trash2 size={14} /> 删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {templates.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-[#64748B]">暂无模板数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
          {rulesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-[#F97316]" />
            </div>
          ) : (
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
                {rules.map((r) => (
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
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit('rule', r)} className="text-[#F97316] hover:underline text-sm flex items-center gap-1">
                          <Pencil size={14} /> 编辑
                        </button>
                        <button onClick={() => handleDelete('rule', r.id)} className="text-rose-400 hover:underline text-sm flex items-center gap-1">
                          <Trash2 size={14} /> 删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[#64748B]">暂无规则数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'slots' && (
        <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
          {slotsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-[#F97316]" />
            </div>
          ) : (
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
                {slots.map((s) => (
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
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit('slot', s)} className="text-[#F97316] hover:underline text-sm flex items-center gap-1">
                          <Pencil size={14} /> 编辑
                        </button>
                        <button onClick={() => handleDelete('slot', s.id)} className="text-rose-400 hover:underline text-sm flex items-center gap-1">
                          <Trash2 size={14} /> 删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {slots.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[#64748B]">暂无时段数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'nodes' && (
        <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
          {nodesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-[#F97316]" />
            </div>
          ) : (
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
                {workflowNodes.map((n) => (
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
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit('node', n)} className="text-[#F97316] hover:underline text-sm flex items-center gap-1">
                          <Pencil size={14} /> 编辑
                        </button>
                        <button onClick={() => handleDelete('node', n.id)} className="text-rose-400 hover:underline text-sm flex items-center gap-1">
                          <Trash2 size={14} /> 删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {workflowNodes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[#64748B]">暂无节点数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingItem ? '编辑配置' : '新增配置'} width="max-w-xl">
        <div className="space-y-4">
          {modalType === 'template' && (
            <>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">模板名称</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
                  placeholder="输入模板名称"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">模板内容</label>
                <textarea
                  value={templateForm.content}
                  onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                  className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none resize-none h-32"
                  placeholder="输入模板内容"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">字段（逗号分隔）</label>
                <input
                  type="text"
                  value={templateForm.fields}
                  onChange={(e) => setTemplateForm({ ...templateForm, fields: e.target.value })}
                  className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
                  placeholder="例如：owner_name, tenant_name"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">状态</label>
                <select
                  value={templateForm.isActive ? 'true' : 'false'}
                  onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.value === 'true' })}
                  className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
                >
                  <option value="true" className="bg-[#0F172A]">启用</option>
                  <option value="false" className="bg-[#0F172A]">停用</option>
                </select>
              </div>
            </>
          )}

          {modalType === 'rule' && (
            <>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">规则名称</label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
                  placeholder="输入规则名称"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">项目类型</label>
                <input
                  type="text"
                  value={ruleForm.projectType}
                  onChange={(e) => setRuleForm({ ...ruleForm, projectType: e.target.value })}
                  className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
                  placeholder="输入项目类型"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">结算周期</label>
                <select
                  value={ruleForm.cycle}
                  onChange={(e) => setRuleForm({ ...ruleForm, cycle: e.target.value as 'monthly' | 'quarterly' | 'yearly' })}
                  className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
                >
                  <option value="monthly" className="bg-[#0F172A]">月结</option>
                  <option value="quarterly" className="bg-[#0F172A]">季结</option>
                  <option value="yearly" className="bg-[#0F172A]">年结</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">分成比例</label>
                <input
                  type="number"
                  step="0.01"
                  value={ruleForm.ratio}
                  onChange={(e) => setRuleForm({ ...ruleForm, ratio: Number(e.target.value) })}
                  className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
                  placeholder="例如：0.95"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">状态</label>
                <select
                  value={ruleForm.isActive ? 'true' : 'false'}
                  onChange={(e) => setRuleForm({ ...ruleForm, isActive: e.target.value === 'true' })}
                  className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
                >
                  <option value="true" className="bg-[#0F172A]">启用</option>
                  <option value="false" className="bg-[#0F172A]">停用</option>
                </select>
              </div>
            </>
          )}

          {modalType === 'slot' && (
            <>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">星期</label>
                <select
                  value={slotForm.dayOfWeek}
                  onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: Number(e.target.value) })}
                  className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
                >
                  {dayLabels.map((label, i) => (
                    <option key={i} value={i} className="bg-[#0F172A]">{label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">开始时间</label>
                  <input
                    type="time"
                    value={slotForm.startTime}
                    onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                    className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">结束时间</label>
                  <input
                    type="time"
                    value={slotForm.endTime}
                    onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                    className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">间隔(分钟)</label>
                <select
                  value={slotForm.interval}
                  onChange={(e) => setSlotForm({ ...slotForm, interval: Number(e.target.value) })}
                  className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
                >
                  <option value={30} className="bg-[#0F172A]">30分钟</option>
                  <option value={60} className="bg-[#0F172A]">60分钟</option>
                  <option value={90} className="bg-[#0F172A]">90分钟</option>
                  <option value={120} className="bg-[#0F172A]">120分钟</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">状态</label>
                <select
                  value={slotForm.isActive ? 'true' : 'false'}
                  onChange={(e) => setSlotForm({ ...slotForm, isActive: e.target.value === 'true' })}
                  className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
                >
                  <option value="true" className="bg-[#0F172A]">启用</option>
                  <option value="false" className="bg-[#0F172A]">停用</option>
                </select>
              </div>
            </>
          )}

          {modalType === 'node' && (
            <>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">流程类型</label>
                <select
                  value={nodeForm.processType}
                  onChange={(e) => setNodeForm({ ...nodeForm, processType: e.target.value as 'contract' | 'settlement' | 'appointment' })}
                  className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
                >
                  <option value="contract" className="bg-[#0F172A]">合同</option>
                  <option value="settlement" className="bg-[#0F172A]">结算</option>
                  <option value="appointment" className="bg-[#0F172A]">预约</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">节点名称</label>
                <input
                  type="text"
                  value={nodeForm.nodeName}
                  onChange={(e) => setNodeForm({ ...nodeForm, nodeName: e.target.value })}
                  className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
                  placeholder="输入节点名称"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">顺序</label>
                <input
                  type="number"
                  value={nodeForm.nodeOrder}
                  onChange={(e) => setNodeForm({ ...nodeForm, nodeOrder: Number(e.target.value) })}
                  className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
                  placeholder="输入节点顺序"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">审批角色</label>
                <input
                  type="text"
                  value={nodeForm.approverRole}
                  onChange={(e) => setNodeForm({ ...nodeForm, approverRole: e.target.value })}
                  className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
                  placeholder="输入审批角色"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={nodeForm.isRequired}
                  onChange={(e) => setNodeForm({ ...nodeForm, isRequired: e.target.checked })}
                  className="w-4 h-4 rounded border-[#334155] bg-[#0F172A]"
                />
                <label htmlFor="isRequired" className="text-sm text-[#94A3B8]">必填节点</label>
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">状态</label>
                <select
                  value={nodeForm.isActive ? 'true' : 'false'}
                  onChange={(e) => setNodeForm({ ...nodeForm, isActive: e.target.value === 'true' })}
                  className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
                >
                  <option value="true" className="bg-[#0F172A]">启用</option>
                  <option value="false" className="bg-[#0F172A]">停用</option>
                </select>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm text-[#94A3B8] hover:bg-[#334155]">取消</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA580C] disabled:opacity-50 flex items-center gap-1">
              {saving && <Loader2 size={16} className="animate-spin" />}
              保存
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
