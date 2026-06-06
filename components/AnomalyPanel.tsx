"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  Users,
  MapPin,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  X,
  Save,
} from "lucide-react";
import { getAnomalies, getArrivalRecords, getTrips, updateAnomalyNote } from "@/lib/dataStore";
import type { Anomaly } from "@/types";

const typeLabels: Record<string, { label: string; icon: any; color: string }> = {
  delay: { label: "晚点", icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-200" },
  crowding: { label: "拥挤", icon: Users, color: "text-red-600 bg-red-50 border-red-200" },
  complaint_spike: {
    label: "投诉突增",
    icon: MessageSquare,
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
  detour: { label: "临时绕行", icon: MapPin, color: "text-blue-600 bg-blue-50 border-blue-200" },
};

const severityLabels: Record<string, { label: string; color: string }> = {
  low: { label: "低", color: "bg-green-100 text-green-700" },
  medium: { label: "中", color: "bg-amber-100 text-amber-700" },
  high: { label: "高", color: "bg-red-100 text-red-700" },
};

export default function AnomalyPanel() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>(getAnomalies());
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterResolved, setFilterResolved] = useState<string>("all");
  const [noteText, setNoteText] = useState("");
  const [showDetail, setShowDetail] = useState(false);

  const filteredAnomalies = anomalies.filter((a) => {
    if (filterType !== "all" && a.type !== filterType) return false;
    if (filterResolved !== "all") {
      if (filterResolved === "resolved" && !a.resolved) return false;
      if (filterResolved === "unresolved" && a.resolved) return false;
    }
    return true;
  });

  const handleAddNote = (anomaly: Anomaly) => {
    setSelectedAnomaly(anomaly);
    setNoteText(anomaly.notes || "");
    setShowDetail(true);
  };

  const handleSaveNote = () => {
    if (!selectedAnomaly || !noteText.trim()) return;

    const updated = updateAnomalyNote(selectedAnomaly.id, noteText, "调度员");
    if (updated) {
      setAnomalies((prev) =>
        prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
      );
      setShowDetail(false);
      setSelectedAnomaly(null);
      setNoteText("");
    }
  };

  const getDetailRecords = (anomaly: Anomaly) => {
    if (anomaly.tripId) {
      return getArrivalRecords(undefined, undefined, anomaly.tripId);
    }
    if (anomaly.stationId) {
      return getArrivalRecords(anomaly.routeId, anomaly.stationId).slice(0, 20);
    }
    return getArrivalRecords(anomaly.routeId).slice(0, 20);
  };

  const crowdingLabels: Record<string, string> = {
    low: "宽松",
    medium: "适中",
    high: "拥挤",
    extreme: "极度拥挤",
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">异常事件管理</h3>
            <p className="text-sm text-gray-500 mt-1">
              查看和处理运营过程中的异常事件，支持添加人工备注
            </p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部类型</option>
              {Object.entries(typeLabels).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>

            <select
              value={filterResolved}
              onChange={(e) => setFilterResolved(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="unresolved">未处理</option>
              <option value="resolved">已处理</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-700">总异常</span>
            </div>
            <p className="text-2xl font-bold text-red-700 mt-1">{anomalies.length}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">待处理</span>
            </div>
            <p className="text-2xl font-bold text-amber-700 mt-1">
              {anomalies.filter((a) => !a.resolved).length}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">已处理</span>
            </div>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {anomalies.filter((a) => a.resolved).length}
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">高优先级</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {anomalies.filter((a) => a.severity === "high" && !a.resolved).length}
            </p>
          </div>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
          {filteredAnomalies.map((anomaly) => {
            const typeConfig = typeLabels[anomaly.type];
            const severityConfig = severityLabels[anomaly.severity];
            const Icon = typeConfig.icon;

            return (
              <div
                key={anomaly.id}
                className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                  anomaly.resolved ? "opacity-70" : ""
                } ${typeConfig.color}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-gray-900">{anomaly.description}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityConfig.color}`}
                        >
                          {severityConfig.label}
                        </span>
                        {anomaly.resolved && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            已处理
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(anomaly.timestamp).toLocaleString("zh-CN")}
                        {anomaly.resolvedBy && ` · 处理人: ${anomaly.resolvedBy}`}
                      </p>
                      {anomaly.notes && (
                        <p className="text-sm text-gray-600 mt-2 bg-white/50 p-2 rounded">
                          📝 {anomaly.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddNote(anomaly)}
                      className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {anomaly.resolved ? "查看详情" : "添加备注"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showDetail && selectedAnomaly && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">异常详情</h3>
              <button
                onClick={() => {
                  setShowDetail(false);
                  setSelectedAnomaly(null);
                  setNoteText("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">异常类型</span>
                    <p className="font-medium mt-1">{typeLabels[selectedAnomaly.type].label}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">严重程度</span>
                    <p className="font-medium mt-1">
                      {severityLabels[selectedAnomaly.severity].label}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">发生时间</span>
                    <p className="font-medium mt-1">
                      {new Date(selectedAnomaly.timestamp).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">处理状态</span>
                    <p className="font-medium mt-1">
                      {selectedAnomaly.resolved ? "已处理" : "待处理"}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-gray-900 font-medium">{selectedAnomaly.description}</p>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">关联明细数据</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-3 py-2 font-medium text-gray-600">时间</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">站点</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">延误</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">满载率</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">拥挤度</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {getDetailRecords(selectedAnomaly).slice(0, 10).map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-600">
                            {new Date(record.actualTime).toLocaleTimeString("zh-CN")}
                          </td>
                          <td className="px-3 py-2 font-medium">{record.stationName}</td>
                          <td className="px-3 py-2">
                            {record.delaySeconds > 0
                              ? `+${Math.round(record.delaySeconds / 60)}分`
                              : "准点"}
                          </td>
                          <td className="px-3 py-2">
                            {Math.round(record.loadFactor * 100)}%
                          </td>
                          <td className="px-3 py-2">{crowdingLabels[record.crowdingLevel]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  人工备注
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="输入处理备注、原因分析或解决方案..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  disabled={selectedAnomaly.resolved}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDetail(false);
                  setSelectedAnomaly(null);
                  setNoteText("");
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              {!selectedAnomaly.resolved && (
                <button
                  onClick={handleSaveNote}
                  disabled={!noteText.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  保存并标记已处理
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
