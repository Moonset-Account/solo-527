import { useState } from "react";
import type { Filters } from "~/types";

interface ExportButtonProps {
  filters: Filters;
}

export function ExportButton({ filters }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; files?: string[] } | null>(null);

  const handleExport = async (type: string, format: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, format, filters }),
      });
      const data = await res.json();
      setResult(data);
      setTimeout(() => setResult(null), 5000);
    } catch (err) {
      setResult({ success: false });
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
      >
        <span>📥</span>
        导出数据
      </button>

      {result && (
        <div
          className={`absolute right-0 top-full mt-2 px-3 py-2 rounded-md text-sm z-50 ${
            result.success
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {result.success ? "导出成功！" : "导出失败"}
        </div>
      )}

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-48">
          <div className="p-2 border-b border-gray-100">
            <p className="text-xs text-gray-500 px-2 py-1">选择导出类型</p>
            {loading && <p className="text-xs text-gray-400 px-2 py-1">导出中...</p>}
          </div>
          <div className="p-2 space-y-1">
            {[
              { type: "full", label: "完整数据" },
              { type: "funnel", label: "漏斗数据" },
              { type: "quiz", label: "测验数据" },
              { type: "department", label: "部门对比" },
              { type: "certificate", label: "证书数据" },
            ].map(item => (
              <div key={item.type} className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded">
                <span className="text-sm text-gray-700">{item.label}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleExport(item.type, "csv")}
                    className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport(item.type, "json")}
                    className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                  >
                    JSON
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
