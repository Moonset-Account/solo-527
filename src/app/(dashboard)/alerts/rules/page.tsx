"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Filter, Search } from "lucide-react";
import { mockData } from "@/utils/mockData";
import { AlertRuleCard } from "@/components/alerts/AlertRuleCard";

type FilterStatus = "all" | "enabled" | "disabled";

export default function AlertRulesPage() {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [rules, setRules] = useState(mockData.alertRules);

  const filteredRules = rules.filter((rule) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "enabled" && rule.isEnabled) ||
      (filter === "disabled" && !rule.isEnabled);

    const matchesSearch =
      !searchQuery ||
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.metric.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleToggle = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isEnabled: !r.isEnabled } : r))
    );
  };

  const handleEdit = (id: string) => {
    window.location.href = `/alerts/rules/${id}/edit`;
  };

  const handleDelete = (id: string) => {
    if (confirm("确认删除此告警规则？")) {
      setRules((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const enabledCount = rules.filter((r) => r.isEnabled).length;
  const disabledCount = rules.filter((r) => !r.isEnabled).length;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-neutral-900">告警规则</h1>
          <p className="text-sm text-neutral-500 mt-1">
            共 {rules.length} 条规则，{enabledCount} 条已启用，{disabledCount} 条已停用
          </p>
        </div>

        <Link href="/alerts/rules/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          新建规则
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-neutral-200 flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="搜索规则名称或指标..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm flex-1 outline-none placeholder:text-neutral-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400" />
          {(["all", "enabled", "disabled"] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === status
                  ? "bg-primary-50 text-primary-700"
                  : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {status === "all" ? "全部" : status === "enabled" ? "已启用" : "已停用"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredRules.map((rule) => (
          <div key={rule.id} className="group">
            <AlertRuleCard
              rule={rule}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        ))}

        {filteredRules.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-neutral-400 text-sm">暂无匹配的告警规则</p>
          </div>
        )}
      </div>
    </div>
  );
}
