"use client";

import { X, Info, Calculator, Database, Clock, History } from "lucide-react";
import { mockData } from "@/utils/mockData";
import { formatDateTime } from "@/utils/format";

interface MetricDefinitionDrawerProps {
  metricId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MetricDefinitionDrawer({
  metricId,
  isOpen,
  onClose,
}: MetricDefinitionDrawerProps) {
  const metric = metricId
    ? mockData.metrics.find((m) => m.id === metricId)
    : null;

  if (!metric) return null;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-xl border-l border-neutral-200 transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-5 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <Info className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <h2 className="font-semibold text-neutral-800">{metric.name}</h2>
                <p className="text-xs text-neutral-500">指标口径说明</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
            <div>
              <h3 className="text-sm font-medium text-neutral-800 mb-2">指标描述</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {metric.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-neutral-50 rounded-lg">
                <div className="text-xs text-neutral-500 mb-1">指标编码</div>
                <div className="text-sm font-medium text-neutral-800 font-mono">
                  {metric.code}
                </div>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg">
                <div className="text-xs text-neutral-500 mb-1">数据分类</div>
                <div className="text-sm font-medium text-neutral-800">{metric.category}</div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-primary-50 to-sky-50 rounded-xl border border-primary-100">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-primary-600" />
                <h3 className="text-sm font-medium text-primary-800">计算公式</h3>
              </div>
              <div className="p-3 bg-white/70 rounded-lg font-mono text-sm text-neutral-700">
                {metric.formula}
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-medium text-amber-800">数据来源</h3>
              </div>
              <p className="text-sm text-amber-700">{metric.dataSource}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-neutral-500" />
                <h3 className="text-sm font-medium text-neutral-800">口径变更记录</h3>
              </div>
              <div className="space-y-3">
                <div className="relative pl-4 pb-3 border-l-2 border-neutral-100 last:border-l-0">
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary-500" />
                  <div className="text-xs text-neutral-500 mb-1">
                    2024-03-15 14:30
                  </div>
                  <div className="text-sm text-neutral-700">
                    新增退款订单剔除逻辑
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    修改人：数据运营
                  </div>
                </div>
                <div className="relative pl-4 pb-3 border-l-2 border-neutral-100 last:border-l-0">
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-neutral-300" />
                  <div className="text-xs text-neutral-500 mb-1">
                    2024-01-01 00:00
                  </div>
                  <div className="text-sm text-neutral-700">指标初始定义</div>
                  <div className="text-xs text-neutral-500 mt-1">
                    创建人：系统
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-neutral-100">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Clock className="w-3 h-3" />
              <span>最后更新：{formatDateTime(metric.updatedAt)}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
