"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { DataTable, Pagination } from "@/components/ui/DataTable";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatDate } from "@/lib/utils";
import { Building2, Users, Bell, Save, UserPlus, Edit2, Check } from "lucide-react";
import type { Campus, Staff, SettingRule, Role } from "@/types";
import { cn } from "@/lib/utils";

export function SettingsForm() {
  const [activeSection, setActiveSection] = useState<"campus" | "staff" | "rules">("campus");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
      <aside className="space-y-1">
        {([
          { k: "campus", label: "校区信息", icon: <Building2 size={16} /> },
          { k: "staff", label: "员工管理", icon: <Users size={16} /> },
          { k: "rules", label: "提醒规则", icon: <Bell size={16} /> },
        ] as const).map((s) => (
          <button
            key={s.k}
            onClick={() => setActiveSection(s.k)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all text-left",
              activeSection === s.k
                ? "bg-ink-gold-500 text-white shadow-sm"
                : "text-deep-blue-600 hover:bg-deep-blue-50",
            )}
          >
            {s.icon}{s.label}
          </button>
        ))}
      </aside>

      <div className="space-y-6">
        {activeSection === "campus" && <CampusSection />}
        {activeSection === "staff" && <StaffSection />}
        {activeSection === "rules" && <RulesSection />}
      </div>
    </div>
  );
}

function CampusSection() {
  const campusQ = trpc.settings.getCampus.useQuery();
  const [form, setForm] = useState({ name: "", address: "", phone: "", logoUrl: "" });
  const utils = trpc.useUtils();
  const update = trpc.settings.updateCampus.useMutation({
    onSuccess: () => utils.settings.getCampus.invalidate(),
  });
  const campus = campusQ.data as Campus | undefined;

  useEffect(() => {
    if (campus) setForm({ name: campus.name ?? "", address: campus.address ?? "", phone: campus.phone ?? "", logoUrl: campus.logoUrl ?? "" });
  }, [campus]);

  return (
    <div className="card p-6 space-y-5">
      <h3 className="section-title flex items-center gap-2">
        <Building2 size={18} className="text-ink-gold-500" />校区基本信息
      </h3>
      <form onSubmit={(e) => { e.preventDefault(); update.mutate(form); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="label">校区名称 <span className="text-alert-red">*</span></label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="请输入校区名称" />
        </div>
        <div>
          <label className="label">联系电话</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="010-xxxxxxx" />
        </div>
        <div>
          <label className="label">Logo URL</label>
          <input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} className="input" placeholder="https://..." />
        </div>
        <div className="md:col-span-2">
          <label className="label">校区地址</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            rows={2}
            className="input resize-none"
            placeholder="请输入详细地址"
          />
        </div>
        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
          <button type="submit" className="btn-primary" disabled={update.isPending || !form.name.trim()}>
            <Save size={16} />保存修改
          </button>
        </div>
      </form>
    </div>
  );
}

type StaffItem = Staff & {};

function StaffSection() {
  const [page, setPage] = useState(1);
  const staffQ = trpc.settings.staffList.useQuery({ page, pageSize: 10 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role>("TEACHING_LEAD");
  const utils = trpc.useUtils();
  const updateRole = trpc.settings.updateStaffRole.useMutation({
    onSuccess: () => { utils.settings.staffList.invalidate(); setEditingId(null); },
  });
  const staff = staffQ.data as { items: StaffItem[]; total: number; page: number; pageSize: number } | undefined;

  const roleMap: Record<Role, { label: string; variant: "gold" | "info" | "success" | "danger" }> = {
    PRINCIPAL: { label: "校长", variant: "gold" },
    ACADEMIC_AFFAIRS: { label: "教务", variant: "info" },
    TEACHING_LEAD: { label: "教学主管", variant: "success" },
    FINANCE: { label: "财务", variant: "danger" },
  };

  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="section-title flex items-center gap-2">
            <Users size={18} className="text-ink-gold-500" />员工列表
          </h3>
          <button className="btn-secondary text-xs">
            <UserPlus size={14} />添加员工
          </button>
        </div>
        <DataTable<StaffItem>
          columns={[
            { key: "avatar", header: "", width: "60px", render: (r) => (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-deep-blue-500 to-deep-blue-700 text-white flex items-center justify-center text-xs font-semibold">
                {r.name.slice(0, 1)}
              </div>
            )},
            { key: "name", header: "姓名", width: "100px", render: (r) => <span className="text-sm font-medium text-deep-blue-700">{r.name}</span> },
            { key: "email", header: "邮箱", render: (r) => <span className="text-xs text-deep-blue-500">{r.email ?? "-"}</span> },
            { key: "phone", header: "电话", width: "120px", render: (r) => <span className="text-xs text-deep-blue-500">{r.phone ?? "-"}</span> },
            { key: "role", header: "角色", width: "160px", render: (r) => editingId === r.id ? (
              <div className="flex items-center gap-1.5">
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="input !py-1 text-xs"
                >
                  {(Object.keys(roleMap) as Role[]).map((k) => (
                    <option key={k} value={k}>{roleMap[k].label}</option>
                  ))}
                </select>
                <button
                  onClick={() => updateRole.mutate({ id: r.id, role: editRole })}
                  className="btn-primary !px-2 !py-1 text-xs"
                ><Check size={13} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <StatusChip variant={roleMap[r.role].variant} size="sm">{roleMap[r.role].label}</StatusChip>
                <button
                  onClick={() => { setEditingId(r.id); setEditRole(r.role); }}
                  className="text-deep-blue-400 hover:text-ink-gold-600"
                ><Edit2 size={13} /></button>
              </div>
            )},
            { key: "status", header: "状态", width: "80px", render: (r) => (
              <StatusChip variant={r.status === "ACTIVE" ? "success" : "ghost"} size="sm">
                {r.status === "ACTIVE" ? "在职" : "停用"}
              </StatusChip>
            )},
            { key: "createdAt", header: "入职时间", width: "110px", render: (r) => formatDate(r.createdAt) },
          ]}
          data={staff?.items ?? []}
          rowKey={(r) => r.id}
        />
        {staff && <Pagination page={page} pageSize={staff.pageSize} total={staff.total} onPageChange={setPage} />}
      </div>
    </div>
  );
}

function RulesSection() {
  const rulesQ = trpc.settings.getRules.useQuery();
  const [form, setForm] = useState({ trialFollowUpHours: 24, renewalHighRiskHours: 10, renewalMidRiskHours: 20, feedbackTimeoutHours: 48 });
  const utils = trpc.useUtils();
  const update = trpc.settings.updateRules.useMutation({
    onSuccess: () => utils.settings.getRules.invalidate(),
  });
  const rules = rulesQ.data as SettingRule | undefined;

  useEffect(() => {
    if (rules) setForm({
      trialFollowUpHours: rules.trialFollowUpHours,
      renewalHighRiskHours: rules.renewalHighRiskHours,
      renewalMidRiskHours: rules.renewalMidRiskHours,
      feedbackTimeoutHours: rules.feedbackTimeoutHours,
    });
  }, [rules]);

  const fields = [
    { k: "trialFollowUpHours" as const, label: "试听后跟进时限", desc: "试听结束后，需在此时间内完成跟进", unit: "小时", max: 168 },
    { k: "renewalHighRiskHours" as const, label: "续报高风险阈值", desc: "剩余课时低于此值时标记为高风险", unit: "节", max: 200 },
    { k: "renewalMidRiskHours" as const, label: "续报中风险阈值", desc: "剩余课时低于此值时标记为中风险", unit: "节", max: 500 },
    { k: "feedbackTimeoutHours" as const, label: "家长反馈超时", desc: "超过此时间未回复的反馈将高亮提醒", unit: "小时", max: 336 },
  ] as const;

  return (
    <div className="card p-6 space-y-5">
      <h3 className="section-title flex items-center gap-2">
        <Bell size={18} className="text-ink-gold-500" />系统提醒规则
      </h3>
      <p className="text-xs text-deep-blue-400">合理配置提醒规则，帮助教务团队及时跟进关键节点，减少遗漏。</p>
      <form onSubmit={(e) => { e.preventDefault(); update.mutate(form); }} className="space-y-5">
        {fields.map((f) => (
          <div key={f.k} className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4 items-center py-3 border-b border-deep-blue-50 last:border-0">
            <div>
              <div className="text-sm font-medium text-deep-blue-700">{f.label}</div>
              <div className="text-xs text-deep-blue-400 mt-0.5">{f.desc}</div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={f.max}
                value={form[f.k]}
                onChange={(e) => setForm({ ...form, [f.k]: Math.max(1, Math.min(f.max, Number(e.target.value))) })}
                className="input"
              />
              <span className="text-sm text-deep-blue-500 w-8">{f.unit}</span>
            </div>
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <button type="submit" className="btn-primary" disabled={update.isPending}>
            <Save size={16} />保存规则
          </button>
        </div>
      </form>
    </div>
  );
}
