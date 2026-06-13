"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badges";

type MethodEnum = "PHONE" | "WECHAT" | "SMS" | "EMAIL" | "VISIT" | "OTHER";

const METHOD_LABELS: Record<MethodEnum, string> = {
  PHONE: "电话",
  WECHAT: "微信",
  SMS: "短信",
  EMAIL: "邮件",
  VISIT: "上门",
  OTHER: "其他",
};

export default function RulesPage() {
  const { data: rules, isLoading, refetch } = api.followUp.rules.listAll.useQuery();
  const { data: stages } = api.stage.listAll.useQuery();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (rule: any) => {
    setEditing(rule);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">回访规则管理</h2>
          <p className="text-sm text-slate-500 mt-1">配置线索在不同阶段的自动回访触发规则</p>
        </div>
        <button className="btn-dental" onClick={openCreate}>
          + 新建规则
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">名称</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">触发阶段</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">触发方式</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">间隔小时</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">优先级</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">状态</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">加载中…</td></tr>
            ) : !rules?.length ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">暂无规则</td></tr>
            ) : (
              rules.map((r) => (
                <RuleRow
                  key={r.id}
                  rule={r}
                  onEdit={() => openEdit(r)}
                  onToggle={() => refetch()}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <RuleModal
        open={showModal}
        onClose={() => setShowModal(false)}
        editing={editing}
        stages={stages ?? []}
        onDone={() => {
          setShowModal(false);
          refetch();
        }}
      />
    </div>
  );
}

function RuleRow({
  rule,
  onEdit,
  onToggle,
}: {
  rule: any;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const toggle = api.followUp.rules.update.useMutation({
    onSuccess: () => onToggle(),
  });

  return (
    <tr key={rule.id} className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="font-medium">{rule.name}</div>
        {rule.description && (
          <div className="text-xs text-slate-500 mt-0.5">{rule.description}</div>
        )}
      </td>
      <td className="px-4 py-3">
        {rule.triggerStage ? (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="status-dot"
              style={{ backgroundColor: rule.triggerStage.color }}
            />
            <span>{rule.triggerStage.name}</span>
          </span>
        ) : (
          <span className="text-slate-400">不限</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge variant="info">{METHOD_LABELS[rule.method as MethodEnum] ?? rule.method}</Badge>
      </td>
      <td className="px-4 py-3 text-slate-700">{rule.intervalHours}h</td>
      <td className="px-4 py-3">
        <Badge variant={rule.priority > 5 ? "warning" : "slate"}>P{rule.priority}</Badge>
      </td>
      <td className="px-4 py-3">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={rule.isActive}
            disabled={toggle.isPending}
            onChange={(e) =>
              toggle.mutate({ id: rule.id, isActive: e.target.checked })
            }
          />
          <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
        </label>
      </td>
      <td className="px-4 py-3">
        <button className="text-xs text-primary-600 hover:underline" onClick={onEdit}>
          编辑
        </button>
      </td>
    </tr>
  );
}

function RuleModal({
  open,
  onClose,
  editing,
  stages,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  editing: any;
  stages: Array<{ id: string; name: string; color: string }>;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    description: editing?.description ?? "",
    triggerStageId: editing?.triggerStageId ?? "",
    method: (editing?.method ?? "PHONE") as MethodEnum,
    intervalHours: editing?.intervalHours ?? 24,
    templateContent: editing?.templateContent ?? "",
    priority: editing?.priority ?? 0,
    isActive: editing?.isActive ?? true,
  });
  const create = api.followUp.rules.create.useMutation({ onSuccess: () => onDone() });
  const update = api.followUp.rules.update.useMutation({ onSuccess: () => onDone() });
  const isPending = create.isPending || update.isPending;

  const submit = () => {
    if (editing) {
      update.mutate({
        id: editing.id,
        ...form,
        triggerStageId: form.triggerStageId || undefined,
      });
    } else {
      create.mutate({
        ...form,
        triggerStageId: form.triggerStageId || undefined,
      });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "编辑回访规则" : "新建回访规则"}
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button
            className="btn-primary"
            disabled={!form.name || isPending}
            onClick={submit}
          >
            保存
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">规则名称 *</label>
          <input
            className="input"
            placeholder="如：新线索24小时内电话回访"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">规则描述</label>
          <textarea
            className="input min-h-[60px]"
            placeholder="简要描述规则用途"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">触发阶段</label>
            <select
              className="input"
              value={form.triggerStageId}
              onChange={(e) => setForm({ ...form, triggerStageId: e.target.value })}
            >
              <option value="">不限阶段</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">触发方式 *</label>
            <select
              className="input"
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value as MethodEnum })}
            >
              <option value="PHONE">电话</option>
              <option value="WECHAT">微信</option>
              <option value="SMS">短信</option>
              <option value="EMAIL">邮件</option>
              <option value="VISIT">上门</option>
              <option value="OTHER">其他</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">间隔小时 *</label>
            <input
              type="number"
              min={1}
              className="input"
              value={form.intervalHours}
              onChange={(e) => setForm({ ...form, intervalHours: Number(e.target.value) })}
            />
            <p className="text-xs text-slate-500 mt-1">触发阶段后多少小时执行回访</p>
          </div>
          <div>
            <label className="label">优先级</label>
            <input
              type="number"
              min={0}
              max={100}
              className="input"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
            />
            <p className="text-xs text-slate-500 mt-1">数值越大优先级越高</p>
          </div>
        </div>
        <div>
          <label className="label">模板内容</label>
          <textarea
            className="input min-h-[100px]"
            placeholder="回访话术模板，可在执行时参考"
            value={form.templateContent}
            onChange={(e) => setForm({ ...form, templateContent: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="h-4 w-4"
          />
          <label htmlFor="isActive" className="text-sm text-slate-700">
            立即启用该规则
          </label>
        </div>
      </div>
    </Modal>
  );
}
