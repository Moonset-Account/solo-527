"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createPricingRule, updatePricingRule, deletePricingRule } from "@/app/actions";
import {
  formatCurrency,
  formatTime,
  getDayOfWeekName,
} from "@/lib/utils";
import type { PricingRule } from "@/lib/types";

const timeOptions = () => {
  const options: string[] = [];
  for (let h = 6; h <= 23; h++) {
    options.push(`${String(h).padStart(2, "0")}:00`);
  }
  return options;
};

const dayOptions = [
  { value: "", label: "每天（所有日期通用）" },
  { value: "1", label: "周一" },
  { value: "2", label: "周二" },
  { value: "3", label: "周三" },
  { value: "4", label: "周四" },
  { value: "5", label: "周五" },
  { value: "6", label: "周六" },
  { value: "0", label: "周日" },
];

export default function PricingPage() {
  const supabase = createClient();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    day_of_week: "",
    start_time: "06:00",
    end_time: "18:00",
    base_price: 50,
    is_peak: false,
    multiplier: 1,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("pricing_rules")
        .select("*")
        .order("day_of_week", { ascending: true, nullsFirst: true })
        .order("start_time", { ascending: true });
      setRules((data as PricingRule[]) ?? []);
    } catch (e) {
      setError("加载数据失败");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      day_of_week: "",
      start_time: "06:00",
      end_time: "18:00",
      base_price: 50,
      is_peak: false,
      multiplier: 1,
      is_active: true,
    });
  }

  function openCreateModal() {
    resetForm();
    setIsCreateModalOpen(true);
  }

  function openEditModal(rule: PricingRule) {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      day_of_week: rule.day_of_week !== null ? String(rule.day_of_week) : "",
      start_time: rule.start_time.slice(0, 5),
      end_time: rule.end_time.slice(0, 5),
      base_price: rule.base_price,
      is_peak: rule.is_peak,
      multiplier: rule.multiplier,
      is_active: rule.is_active,
    });
  }

  function closeModals() {
    setIsCreateModalOpen(false);
    setEditingRule(null);
    setDeleteConfirmId(null);
    setError("");
    setSuccess("");
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const fd = new FormData();
    fd.append("name", formData.name);
    if (formData.day_of_week) fd.append("day_of_week", formData.day_of_week);
    fd.append("start_time", `${formData.start_time}:00`);
    fd.append("end_time", `${formData.end_time}:00`);
    fd.append("base_price", String(formData.base_price));
    if (formData.is_peak) fd.append("is_peak", "on");
    fd.append("multiplier", String(formData.multiplier));

    const result = await createPricingRule(fd);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("价格规则创建成功");
      closeModals();
      loadData();
    }
  }

  async function handleUpdateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRule) return;
    setError("");
    setSuccess("");

    const fd = new FormData();
    fd.append("name", formData.name);
    if (formData.day_of_week) fd.append("day_of_week", formData.day_of_week);
    fd.append("start_time", `${formData.start_time}:00`);
    fd.append("end_time", `${formData.end_time}:00`);
    fd.append("base_price", String(formData.base_price));
    if (formData.is_peak) fd.append("is_peak", "on");
    fd.append("multiplier", String(formData.multiplier));
    if (formData.is_active) fd.append("is_active", "on");

    const result = await updatePricingRule(editingRule.id, fd);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("价格规则更新成功");
      closeModals();
      loadData();
    }
  }

  async function handleDelete(id: string) {
    const result = await deletePricingRule(id);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("价格规则已删除");
      closeModals();
      loadData();
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">价格规则管理</h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {rules.length} 条规则，其中{" "}
            {rules.filter((r) => r.is_active).length} 条生效中
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          + 新建规则
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg p-3">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 text-sm text-green-600 bg-green-50 rounded-lg p-3">
          {success}
        </div>
      )}

      {loading ? (
        <div className="card text-center py-16 text-slate-500">加载中...</div>
      ) : rules.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">💰</div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            暂无价格规则
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            点击上方按钮创建第一条价格规则
          </p>
          <button onClick={openCreateModal} className="btn-primary">
            + 新建规则
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto card">
          <table className="table">
            <thead>
              <tr>
                <th>规则名称</th>
                <th>适用日期</th>
                <th>时间段</th>
                <th>基础价格</th>
                <th>系数</th>
                <th>实际价格/小时</th>
                <th>状态</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => {
                const actualPrice = rule.base_price * rule.multiplier;
                return (
                  <tr key={rule.id}>
                    <td>
                      <div className="font-medium text-slate-800">
                        {rule.name}
                      </div>
                      {rule.is_peak && (
                        <span className="badge bg-amber-100 text-amber-800 mt-1">
                          高峰期
                        </span>
                      )}
                    </td>
                    <td className="text-slate-700">
                      {rule.day_of_week !== null
                        ? getDayOfWeekName(rule.day_of_week)
                        : "每天"}
                    </td>
                    <td className="text-slate-700">
                      {formatTime(rule.start_time)} -{" "}
                      {formatTime(rule.end_time)}
                    </td>
                    <td className="text-slate-700">
                      {formatCurrency(rule.base_price)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          rule.multiplier > 1
                            ? "bg-amber-100 text-amber-800"
                            : rule.multiplier < 1
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        ×{rule.multiplier}
                      </span>
                    </td>
                    <td className="font-semibold text-emerald-600">
                      {formatCurrency(actualPrice)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          rule.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {rule.is_active ? "生效中" : "已停用"}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEditModal(rule)}
                          className="btn-secondary text-xs px-3 py-1.5"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(rule.id)}
                          className="btn-danger text-xs px-3 py-1.5"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(isCreateModalOpen || editingRule) && (
        <div className="modal-backdrop" onClick={closeModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <form
              onSubmit={editingRule ? handleUpdateSubmit : handleCreateSubmit}
              className="flex flex-col h-full"
            >
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingRule ? "编辑价格规则" : "新建价格规则"}
                </h3>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="label">规则名称 *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="如：工作日白天场、周末高峰等"
                    required
                  />
                </div>

                <div>
                  <label className="label">适用日期</label>
                  <select
                    className="input"
                    value={formData.day_of_week}
                    onChange={(e) =>
                      setFormData({ ...formData, day_of_week: e.target.value })
                    }
                  >
                    {dayOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">开始时间 *</label>
                    <select
                      className="input"
                      value={formData.start_time}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val >= formData.end_time) {
                          const [h] = val.split(":").map(Number);
                          setFormData({
                            ...formData,
                            start_time: val,
                            end_time: `${String(
                              Math.min((h ?? 9) + 1, 23)
                            ).padStart(2, "0")}:00`,
                          });
                        } else {
                          setFormData({ ...formData, start_time: val });
                        }
                      }}
                      required
                    >
                      {timeOptions().map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">结束时间 *</label>
                    <select
                      className="input"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      required
                    >
                      {timeOptions()
                        .filter((t) => t > formData.start_time)
                        .map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">基础价格（元/小时）*</label>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      className="input"
                      value={formData.base_price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          base_price: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="label">价格系数</label>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      max={5}
                      className="input"
                      value={formData.multiplier}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          multiplier: parseFloat(e.target.value) || 1,
                        })
                      }
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      实际价格 = 基础价格 × 系数
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_peak"
                      checked={formData.is_peak}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_peak: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label
                      htmlFor="is_peak"
                      className="text-sm font-medium text-slate-700"
                    >
                      标记为高峰时段
                    </label>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">预估实际价格</div>
                    <div className="text-xl font-bold text-emerald-600">
                      {formatCurrency(formData.base_price * formData.multiplier)}/时
                    </div>
                  </div>
                </div>

                {editingRule && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="rule_is_active"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label
                      htmlFor="rule_is_active"
                      className="text-sm text-slate-700"
                    >
                      启用该规则（停用后将不再用于自动计价）
                    </label>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModals}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  {editingRule ? "保存修改" : "创建规则"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="modal-backdrop" onClick={closeModals}>
          <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                确认删除价格规则
              </h3>
              <p className="text-sm text-slate-600">
                确定要删除此价格规则吗？此操作不可撤销，删除后将使用其他匹配的规则或默认价格。
              </p>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl flex gap-3 justify-end">
              <button onClick={closeModals} className="btn-secondary">
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="btn-danger"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}