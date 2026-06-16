import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import type { ContractTemplate } from '@/types';

const mockTemplates: ContractTemplate[] = [
  { id: 1, name: '标准租赁合同', content: '甲方(业主)：{{owner_name}}\n乙方(租客)：{{tenant_name}}\n租赁房屋：{{room_name}}\n月租金：{{monthly_rent}}', fields: ['owner_name', 'tenant_name', 'room_name', 'monthly_rent', 'start_date', 'end_date'], isActive: true, createdAt: '2026-01-01', updatedAt: '2026-06-01' },
  { id: 2, name: '短租协议', content: '甲方(业主)：{{owner_name}}\n乙方(租客)：{{tenant_name}}\n短期租赁协议', fields: ['owner_name', 'tenant_name', 'room_name'], isActive: true, createdAt: '2026-03-01', updatedAt: '2026-05-15' },
  { id: 3, name: '续租合同', content: '续租协议\n原合同编号：{{original_contract_id}}', fields: ['original_contract_id', 'owner_name', 'tenant_name'], isActive: false, createdAt: '2026-02-01', updatedAt: '2026-04-01' },
];

export default function ContractTemplates() {
  const [templates] = useState(mockTemplates);
  const [showModal, setShowModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<ContractTemplate | null>(null);
  const [form, setForm] = useState({ name: '', content: '', fields: '' });

  const openCreate = () => {
    setEditTemplate(null);
    setForm({ name: '', content: '', fields: '' });
    setShowModal(true);
  };

  const openEdit = (t: ContractTemplate) => {
    setEditTemplate(t);
    setForm({ name: t.name, content: t.content, fields: t.fields.join(', ') });
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-[#F1F5F9]">合同模板管理</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA580C]"
        >
          <Plus size={16} /> 新建模板
        </button>
      </div>

      <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">模板名称</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">字段占位符</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">状态</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">更新时间</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/30">
                <td className="px-4 py-3 text-[#F1F5F9]">{t.name}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {t.fields.map((f) => (
                      <span key={f} className="px-1.5 py-0.5 rounded bg-[#334155] text-xs text-[#94A3B8] font-mono">
                        {`{{${f}}}`}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${t.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {t.isActive ? '启用' : '停用'}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#CBD5E1]">{t.updatedAt}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(t)} className="text-[#F97316] hover:underline text-sm flex items-center gap-1">
                    <Pencil size={14} /> 编辑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editTemplate ? '编辑模板' : '新建模板'} width="max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">模板名称</label>
            <input
              type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
              placeholder="输入模板名称"
            />
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">合同内容</label>
            <p className="text-xs text-[#64748B] mb-1">使用 {'{{字段名}}'} 作为占位符</p>
            <textarea
              value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none resize-none h-40 font-mono"
              placeholder="输入合同内容模板..."
            />
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">字段列表 (逗号分隔)</label>
            <input
              type="text" value={form.fields} onChange={(e) => setForm({ ...form, fields: e.target.value })}
              className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
              placeholder="owner_name, tenant_name, room_name"
            />
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
