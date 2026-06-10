import { json, useLoaderData, useNavigate, useActionData, Form, useFetcher } from "@remix-run/react";
import { useState, useEffect, useRef } from "react";
import type { PurchaseRequest, MaterialItem, MaterialCategory, Attachment, ApiResponse } from "@app/shared";
import { nanoid } from "nanoid";
import { api, formatMoney } from "~/lib/api";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  let editData: PurchaseRequest | null = null;
  if (id) {
    const result = await api.get<PurchaseRequest>(`/api/purchase-requests/${id}`);
    if (result.success && result.data) {
      editData = result.data;
    }
  }

  return json({ editData });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const payload = JSON.parse(formData.get("data") as string);
  const id = formData.get("id") as string;

  let result: ApiResponse<PurchaseRequest>;

  if (id) {
    result = await api.put<PurchaseRequest>(`/api/purchase-requests/${id}`, payload);
  } else {
    result = await api.post<PurchaseRequest>("/api/purchase-requests", payload);
  }

  return json(result);
};

const CATEGORY_OPTIONS: MaterialCategory[] = [
  "steel", "cement", "wood", "concrete", "electrical", "plumbing", "insulation", "other"
];

const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  steel: "钢材", cement: "水泥", wood: "木材", concrete: "混凝土",
  electrical: "电气材料", plumbing: "给排水", insulation: "保温材料", other: "其他"
};

const UNIT_OPTIONS = ["吨", "立方米", "千克", "米", "平方米", "个", "套", "箱", "卷", "根"];

export default function NewPurchaseRequest() {
  const { editData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formState, setFormState] = useState({
    projectName: editData?.projectName || "",
    projectCode: editData?.projectCode || "",
    department: editData?.department || "工程部",
    requiredDate: editData?.requiredDate
      ? new Date(editData.requiredDate).toISOString().slice(0, 10)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    description: editData?.description || "",
  });

  const [items, setItems] = useState<MaterialItem[]>(
    editData?.items || [
      { id: nanoid(12), name: "", category: "steel", specification: "", unit: "吨", quantity: 0, budgetPrice: undefined }
    ]
  );

  const [attachments, setAttachments] = useState<Attachment[]>(editData?.attachments || []);
  const [uploading, setUploading] = useState(false);
  const [changeReason, setChangeReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (actionData?.success) {
      alert(editData ? "更新成功！" : "创建成功！");
      navigate("/pm/requests");
    } else if (actionData?.error) {
      alert("操作失败：" + actionData.error);
    }
  }, [actionData]);

  const updateItem = (id: string, field: keyof MaterialItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addItem = () => {
    setItems([...items, { id: nanoid(12), name: "", category: "steel", specification: "", unit: "吨", quantity: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const result = await api.upload(files);
    setUploading(false);

    if (result.success && result.data) {
      setAttachments([...attachments, ...result.data]);
    } else {
      alert("上传失败：" + result.error);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formState.projectName.trim()) newErrors.projectName = "请输入项目名称";
    if (!formState.projectCode.trim()) newErrors.projectCode = "请输入项目编号";
    if (!formState.requiredDate) newErrors.requiredDate = "请选择需求日期";

    items.forEach((item, idx) => {
      if (!item.name.trim()) newErrors[`item-${idx}-name`] = "请输入材料名称";
      if (!item.specification.trim()) newErrors[`item-${idx}-spec`] = "请输入规格型号";
      if (item.quantity <= 0) newErrors[`item-${idx}-qty`] = "数量必须大于0";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editData && !changeReason.trim()) {
      if (!confirm("编辑单据建议填写变更原因，是否继续？")) return;
    }

    const payload = {
      ...formState,
      requiredDate: new Date(formState.requiredDate),
      items,
      attachments,
      changeReason: changeReason.trim() || undefined,
    };

    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));
    if (editData) formData.append("id", editData.id);

    fetcher.submit(formData, { method: "post" });
  };

  const totalBudget = items.reduce((sum, item) => {
    return sum + ((item.budgetPrice || 0) * item.quantity);
  }, 0);

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {editData ? "编辑采购需求" : "新建采购需求"}
          </h1>
          <p className="text-slate-500 mt-1">{editData?.code || "填写采购需求信息并提交审批"}</p>
        </div>
        <button
          onClick={() => navigate("/pm/requests")}
          className="text-slate-600 hover:text-slate-800 font-medium"
        >
          ← 返回列表
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm">📋</span>
            项目基本信息
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                项目名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formState.projectName}
                onChange={e => setFormState({ ...formState, projectName: e.target.value })}
                placeholder="如：XX商业中心项目"
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.projectName ? "border-red-400 bg-red-50" : "border-slate-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
              />
              {errors.projectName && <p className="text-xs text-red-500 mt-1">{errors.projectName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                项目编号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formState.projectCode}
                onChange={e => setFormState({ ...formState, projectCode: e.target.value })}
                placeholder="如：PRJ-2025-001"
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.projectCode ? "border-red-400 bg-red-50" : "border-slate-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
              />
              {errors.projectCode && <p className="text-xs text-red-500 mt-1">{errors.projectCode}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">所属部门</label>
              <select
                value={formState.department}
                onChange={e => setFormState({ ...formState, department: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
              >
                <option value="工程部">工程部</option>
                <option value="采购部">采购部</option>
                <option value="项目部">项目部</option>
                <option value="基建部">基建部</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                需求到货日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formState.requiredDate}
                onChange={e => setFormState({ ...formState, requiredDate: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.requiredDate ? "border-red-400 bg-red-50" : "border-slate-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
              />
              {errors.requiredDate && <p className="text-xs text-red-500 mt-1">{errors.requiredDate}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">需求描述</label>
              <textarea
                value={formState.description}
                onChange={e => setFormState({ ...formState, description: e.target.value })}
                rows={3}
                placeholder="请详细描述采购需求背景、用途、特殊要求等..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-sm">🧱</span>
              材料明细清单
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-slate-500">预算总价</div>
                <div className="text-xl font-bold text-slate-800">{formatMoney(totalBudget)}</div>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition"
              >
                + 添加材料
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold text-slate-600">
                  <th className="px-4 py-3 text-left w-12">#</th>
                  <th className="px-4 py-3 text-left">材料名称 *</th>
                  <th className="px-4 py-3 text-left w-28">类别</th>
                  <th className="px-4 py-3 text-left">规格型号 *</th>
                  <th className="px-4 py-3 text-left w-24">单位</th>
                  <th className="px-4 py-3 text-right w-28">数量 *</th>
                  <th className="px-4 py-3 text-right w-32">预算单价</th>
                  <th className="px-4 py-3 text-right w-32">小计</th>
                  <th className="px-4 py-3 text-center w-14">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-500 font-medium text-sm">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => updateItem(item.id, "name", e.target.value)}
                        placeholder="如：螺纹钢筋"
                        className={`w-full px-3 py-1.5 rounded-lg border ${errors[`item-${idx}-name`] ? "border-red-400 bg-red-50" : "border-slate-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.category}
                        onChange={e => updateItem(item.id, "category", e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                      >
                        {CATEGORY_OPTIONS.map(c => (
                          <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.specification}
                        onChange={e => updateItem(item.id, "specification", e.target.value)}
                        placeholder="如：HRB400 Φ16mm"
                        className={`w-full px-3 py-1.5 rounded-lg border ${errors[`item-${idx}-spec`] ? "border-red-400 bg-red-50" : "border-slate-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.unit}
                        onChange={e => updateItem(item.id, "unit", e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                      >
                        {UNIT_OPTIONS.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.quantity}
                        min={0}
                        step="any"
                        onChange={e => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-1.5 rounded-lg border text-right ${errors[`item-${idx}-qty`] ? "border-red-400 bg-red-50" : "border-slate-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.budgetPrice ?? ""}
                        min={0}
                        step="any"
                        placeholder="参考价"
                        onChange={e => updateItem(item.id, "budgetPrice", e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                      {formatMoney((item.budgetPrice || 0) * item.quantity)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm">📎</span>
            附件上传
            <span className="text-xs font-normal text-slate-500 ml-2">支持 PDF、Word、Excel、图片等格式，单个文件 ≤ 50MB</span>
          </h2>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="text-4xl mb-3">{uploading ? "⏳" : "📁"}</div>
            <p className="font-medium text-slate-700">{uploading ? "上传中..." : "点击或拖拽文件到此处上传"}</p>
            <p className="text-xs text-slate-400 mt-1">可上传技术规范、图纸、合同模板等相关文件</p>
          </div>

          {attachments.length > 0 && (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {attachments.map(att => (
                <div key={att.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:bg-white hover:shadow-md transition">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-lg shrink-0">
                    📄
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-800 truncate">{att.originalName}</div>
                    <div className="text-xs text-slate-500">
                      {(att.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {editData && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm">📝</span>
              变更说明
            </h2>
            <textarea
              value={changeReason}
              onChange={e => setChangeReason(e.target.value)}
              rows={2}
              placeholder="请说明本次修改的原因（变更历史中将保留此记录）"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
            />
            <p className="text-xs text-slate-400 mt-2">
              💡 提示：所有关键字段变更（状态、金额、材料明细等）将被自动记录，可在单据详情中查看完整变更历史
            </p>
          </div>
        )}

        <div className="sticky bottom-6 z-10">
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-slate-200 p-4 flex items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              共 <span className="font-bold text-slate-800">{items.length}</span> 项材料，
              预算总计 <span className="font-bold text-blue-600">{formatMoney(totalBudget)}</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/pm/requests")}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={fetcher.state !== "idle"}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-md shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fetcher.state !== "idle" ? "提交中..." : (editData ? "保存修改" : "创建采购需求")}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
