import { json, useLoaderData, useNavigate, useActionData, Form, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import type { Supplier, SupplierQualificationStatus, ChangeHistory, ApiResponse } from "@app/shared";
import { api, formatDate } from "~/lib/api";
import { ChangeHistoryView } from "~/components/ChangeHistoryView";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;
  const name = url.searchParams.get("name") || undefined;

  const suppliers = await api.get<Supplier[]>("/api/suppliers", {
    qualificationStatus: status as SupplierQualificationStatus,
    name,
    pageSize: 50,
  });

  return json({ suppliers });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const data = JSON.parse(formData.get("data") as string);
  const id = formData.get("id") as string;

  let result: ApiResponse<Supplier>;
  if (id) {
    result = await api.put<Supplier>(`/api/suppliers/${id}`, data);
  } else {
    result = await api.post<Supplier>("/api/suppliers", data);
  }
  return json(result);
};

const STATUS_MAP: Record<SupplierQualificationStatus, { label: string; color: string; bg: string }> = {
  qualified: { label: "合格", color: "text-emerald-700", bg: "bg-emerald-100 border-emerald-200" },
  warning: { label: "预警", color: "text-amber-700", bg: "bg-amber-100 border-amber-200" },
  expired: { label: "过期", color: "text-red-700", bg: "bg-red-100 border-red-200" },
  blacklisted: { label: "黑名单", color: "text-slate-700", bg: "bg-slate-200 border-slate-300" },
  pending: { label: "待审核", color: "text-blue-700", bg: "bg-blue-100 border-blue-200" },
};

export default function SupplierManagement() {
  const { suppliers } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewHistoryFor, setViewHistoryFor] = useState<Supplier | null>(null);
  const [historyData, setHistoryData] = useState<ChangeHistory[]>([]);

  const [formState, setFormState] = useState({
    name: "",
    shortName: "",
    category: [] as string[],
    businessLicense: "",
    contactPerson: { name: "", title: "", phone: "", email: "" },
    address: "",
    bankAccount: "",
    qualifications: [] as any[],
    qualificationStatus: "pending" as SupplierQualificationStatus,
    rating: 0,
    tags: [] as string[],
    changeReason: "",
  });

  const supplierList = (suppliers.data || []) as Supplier[];

  const stats = {
    total: supplierList.length,
    qualified: supplierList.filter(s => s.qualificationStatus === "qualified").length,
    warning: supplierList.filter(s => s.qualificationStatus === "warning").length,
    expired: supplierList.filter(s => s.qualificationStatus === "expired").length,
  };

  useEffect(() => {
    if (actionData?.success) {
      alert(editingSupplier ? "供应商更新成功！" : "供应商创建成功！");
      setShowForm(false);
      setEditingSupplier(null);
      resetForm();
      window.location.reload();
    } else if (actionData?.error) {
      alert("操作失败：" + actionData.error);
    }
  }, [actionData]);

  const resetForm = () => {
    setFormState({
      name: "",
      shortName: "",
      category: [],
      businessLicense: "",
      contactPerson: { name: "", title: "", phone: "", email: "" },
      address: "",
      bankAccount: "",
      qualifications: [],
      qualificationStatus: "pending",
      rating: 0,
      tags: [],
      changeReason: "",
    });
  };

  const openEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormState({
      name: s.name,
      shortName: s.shortName || "",
      category: s.category || [],
      businessLicense: s.businessLicense || "",
      contactPerson: s.contactPerson || { name: "", title: "", phone: "", email: "" },
      address: s.address || "",
      bankAccount: s.bankAccount || "",
      qualifications: s.qualifications || [],
      qualificationStatus: s.qualificationStatus,
      rating: s.rating || 0,
      tags: s.tags || [],
      changeReason: "",
    });
    setShowForm(true);
  };

  const viewHistory = async (s: Supplier) => {
    setViewHistoryFor(s);
    const res = await api.get(`/api/suppliers/${s.id}/history`);
    setHistoryData((res.data || []) as ChangeHistory[]);
  };

  const toggleCategory = (cat: string) => {
    setFormState(prev => ({
      ...prev,
      category: prev.category.includes(cat)
        ? prev.category.filter(c => c !== cat)
        : [...prev.category, cat]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.contactPerson.name.trim() || !formState.contactPerson.phone.trim()) {
      alert("请填写必填字段：供应商名称、联系人姓名、联系电话");
      return;
    }
    if (editingSupplier && !formState.changeReason.trim()) {
      if (!confirm("编辑供应商建议填写变更原因，是否继续？")) return;
    }
    const fd = new FormData();
    fd.append("data", JSON.stringify({
      ...formState,
      changeReason: formState.changeReason || undefined,
    }));
    if (editingSupplier) fd.append("id", editingSupplier.id);
    fetcher.submit(fd, { method: "post" });
  };

  const addQualification = () => {
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setFormState(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, {
        id: `new-${Date.now()}`,
        name: "",
        type: "",
        issueDate: today,
        expiryDate: nextYear,
        status: "valid",
        attachmentId: ""
      }]
    }));
  };

  const updateQualification = (idx: number, field: string, value: any) => {
    setFormState(prev => {
      const quals = [...prev.qualifications];
      quals[idx] = { ...quals[idx], [field]: value };
      return { ...prev, qualifications: quals };
    });
  };

  const removeQualification = (idx: number) => {
    setFormState(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== idx)
    }));
  };

  const CATEGORY_OPTIONS = [
    "钢材", "水泥", "木材", "混凝土", "电气材料", "给排水",
    "保温材料", "装饰材料", "机械设备", "五金配件", "其他"
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { label: "供应商总数", value: stats.total, icon: "🏢", color: "from-blue-500 to-indigo-600" },
          { label: "资质合格", value: stats.qualified, icon: "✅", color: "from-emerald-500 to-teal-600" },
          { label: "资质预警", value: stats.warning, icon: "⚠️", color: "from-amber-500 to-orange-500" },
          { label: "资质过期", value: stats.expired, icon: "🚫", color: "from-rose-500 to-red-600" },
        ].map((card, i) => (
          <div key={i} className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all relative overflow-hidden">
            <div className={`absolute -right-10 -top-10 w-28 h-28 bg-gradient-to-br ${card.color} opacity-10 rounded-full`}></div>
            <div className="text-3xl mb-2">{card.icon}</div>
            <div className="text-sm text-slate-500 font-medium">{card.label}</div>
            <div className="mt-2 text-4xl font-bold text-slate-800 tracking-tight">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">供应商名录管理</h2>
            <p className="text-sm text-slate-500 mt-1">维护供应商信息，跟踪资质状态与评级</p>
          </div>
          <button
            onClick={() => { setEditingSupplier(null); resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow hover:shadow-md transition"
          >
            <span>➕</span> 新增供应商
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">供应商</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">联系人</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">经营品类</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase">资质文件</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase">资质状态</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase">评级</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {supplierList.map(s => {
                const st = STATUS_MAP[s.qualificationStatus];
                return (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center font-bold text-indigo-700 text-lg shrink-0">
                          {(s.shortName || s.name)[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{s.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5 font-mono">{s.code} · {s.address || "无地址"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-medium text-slate-700">{s.contactPerson?.name || "-"}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        📞 {s.contactPerson?.phone || "-"}
                      </div>
                      {s.contactPerson?.email && (
                        <div className="text-xs text-blue-600 mt-0.5">
                          ✉️ {s.contactPerson.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(s.category || []).slice(0, 3).map((c, i) => (
                          <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            {c}
                          </span>
                        ))}
                        {(s.category || []).length > 3 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                            +{s.category.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-lg text-sm font-bold ${
                        (s.qualifications || []).length === 0
                          ? "bg-slate-100 text-slate-500"
                          : "bg-indigo-100 text-indigo-700"
                      }`}>
                        {s.qualifications?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${st.color} ${st.bg}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-amber-500 text-lg tracking-wider">
                        {"★".repeat(Math.round(s.rating || 0))}
                        <span className="text-slate-300">{"★".repeat(5 - Math.round(s.rating || 0))}</span>
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm">
                        <button
                          onClick={() => openEdit(s)}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          编辑
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => viewHistory(s)}
                          className="text-purple-600 hover:text-purple-800 font-medium hover:underline"
                        >
                          变更记录
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {supplierList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="text-5xl mb-3">🏢</div>
                    <p className="font-medium text-slate-700">暂无供应商数据</p>
                    <p className="text-sm text-slate-500 mt-1">点击右上角按钮添加第一个供应商</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {editingSupplier ? "编辑供应商" : "新增供应商"}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  填写供应商基本信息与资质文件。关键字段修改将被记录到变更历史。
                </p>
              </div>
              <button
                onClick={() => { setShowForm(false); setEditingSupplier(null); }}
                className="w-10 h-10 rounded-lg hover:bg-white/80 flex items-center justify-center text-slate-500 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div>
                <h4 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-blue-500"></span>
                  基本信息
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      供应商全称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formState.name}
                      onChange={e => setFormState({ ...formState, name: e.target.value })}
                      placeholder="如：XX建设材料有限公司"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">简称</label>
                    <input
                      type="text"
                      value={formState.shortName}
                      onChange={e => setFormState({ ...formState, shortName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">统一社会信用代码</label>
                    <input
                      type="text"
                      value={formState.businessLicense}
                      onChange={e => setFormState({ ...formState, businessLicense: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">资质状态</label>
                    <select
                      value={formState.qualificationStatus}
                      onChange={e => setFormState({ ...formState, qualificationStatus: e.target.value as SupplierQualificationStatus })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                    >
                      {(Object.keys(STATUS_MAP) as SupplierQualificationStatus[]).map(k => (
                        <option key={k} value={k}>{STATUS_MAP[k].label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">公司地址</label>
                    <input
                      type="text"
                      value={formState.address}
                      onChange={e => setFormState({ ...formState, address: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">经营品类 <span className="font-normal text-slate-400">(可多选)</span></label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORY_OPTIONS.map(cat => (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                            formState.category.includes(cat)
                              ? "bg-blue-600 text-white shadow"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">信用评级</label>
                    <div className="flex items-center gap-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setFormState({ ...formState, rating: star })}
                          className="text-3xl transition-transform hover:scale-110"
                        >
                          <span className={star <= formState.rating ? "text-amber-400" : "text-slate-200"}>★</span>
                        </button>
                      ))}
                      <span className="text-sm text-slate-500 ml-2">{formState.rating} / 5 星</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-purple-500"></span>
                  联系信息 <span className="text-xs font-normal text-red-500">* 至少填写姓名和电话</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">联系人姓名 *</label>
                    <input
                      type="text"
                      value={formState.contactPerson.name}
                      onChange={e => setFormState({ ...formState, contactPerson: { ...formState.contactPerson, name: e.target.value } })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">职务</label>
                    <input
                      type="text"
                      value={formState.contactPerson.title}
                      onChange={e => setFormState({ ...formState, contactPerson: { ...formState.contactPerson, title: e.target.value } })}
                      placeholder="如：销售总监、采购经理"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">联系电话 *</label>
                    <input
                      type="tel"
                      value={formState.contactPerson.phone}
                      onChange={e => setFormState({ ...formState, contactPerson: { ...formState.contactPerson, phone: e.target.value } })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">电子邮箱</label>
                    <input
                      type="email"
                      value={formState.contactPerson.email}
                      onChange={e => setFormState({ ...formState, contactPerson: { ...formState.contactPerson, email: e.target.value } })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-1.5 h-5 rounded-full bg-emerald-500"></span>
                    资质文件
                  </h4>
                  <button
                    type="button"
                    onClick={addQualification}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    + 添加资质文件
                  </button>
                </div>
                {formState.qualifications.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                    暂无资质文件，点击右上角"添加资质文件"按钮添加
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formState.qualifications.map((q: any, idx: number) => (
                      <div key={q.id || idx} className="p-5 bg-slate-50/70 rounded-xl border border-slate-200 relative">
                        <button
                          type="button"
                          onClick={() => removeQualification(idx)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition"
                        >
                          ✕
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-10">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">资质名称</label>
                            <input
                              type="text"
                              value={q.name}
                              onChange={e => updateQualification(idx, "name", e.target.value)}
                              placeholder="如：营业执照、建筑业企业资质证书"
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">证件类型</label>
                            <input
                              type="text"
                              value={q.type}
                              onChange={e => updateQualification(idx, "type", e.target.value)}
                              placeholder="如：三证合一、资质证书"
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">签发日期</label>
                            <input
                              type="date"
                              value={new Date(q.issueDate).toISOString().slice(0, 10)}
                              onChange={e => updateQualification(idx, "issueDate", new Date(e.target.value))}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">到期日期</label>
                            <input
                              type="date"
                              value={new Date(q.expiryDate).toISOString().slice(0, 10)}
                              onChange={e => updateQualification(idx, "expiryDate", new Date(e.target.value))}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {editingSupplier && (
                <div className="p-5 bg-amber-50/50 rounded-xl border border-amber-200">
                  <label className="block text-sm font-bold text-amber-900 mb-2">📝 变更原因</label>
                  <textarea
                    value={formState.changeReason}
                    onChange={e => setFormState({ ...formState, changeReason: e.target.value })}
                    rows={2}
                    placeholder="请说明本次修改的原因（变更历史中将保留此记录）"
                    className="w-full px-4 py-2.5 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition resize-none text-sm"
                  />
                  <p className="text-xs text-amber-700 mt-2">
                    💡 关键字段（资质状态、联系人、评级、资质文件等）的变更会被自动记录到变更历史
                  </p>
                </div>
              )}

              <div className="sticky bottom-0 bg-white border-t border-slate-100 pt-5 flex justify-end gap-3 -mx-6 px-6">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingSupplier(null); }}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow hover:shadow-md transition"
                >
                  {editingSupplier ? "保存修改" : "创建供应商"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewHistoryFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  变更历史 - {viewHistoryFor.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  共 {historyData.length} 条变更记录
                </p>
              </div>
              <button
                onClick={() => { setViewHistoryFor(null); setHistoryData([]); }}
                className="w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <ChangeHistoryView history={historyData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
