"use client";

import { useState, useEffect } from "react";
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
import { api } from "@/lib/apiClient";

type Anomaly = {
  id: string;
  type: string;
  routeId: string;
  stationId?: string;
  tripId?: string;
  timestamp: string;
  severity: string;
  description: string;
  notes?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
};

type ArrivalRecord = {
  id: string;
  tripId: string;
  routeId: string;
  stationId: string;
  stationName: string;
  scheduledTime: string;
  actualTime: string;
  delaySeconds: number;
  loadFactor: number;
  passengerCount: number;
  crowdingLevel: string;
  isDetour: boolean;
  timestamp: string;
};

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
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterResolved, setFilterResolved] = useState<string>("all");
  const [noteText, setNoteText] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailRecords, setDetailRecords] = useState<ArrivalRecord[]>([]);

  useEffect(() => {
    async function loadAnomalies() {
      try {
        const data = await api.getAnomalies();
        setAnomalies(data as Anomaly[]);
      } catch (error) {
        console.error("加载异常数据失败:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAnomalies();
  }, []);

  const filteredAnomalies = anomalies.filter((a) => {
    if (filterType !== "all" && a.type !== filterType) return false;
    if (filterResolved !== "all") {
      if (filterResolved === "resolved" && !a.resolved) return false;
      if (filterResolved === "unresolved" && a.resolved) return false;
    }
    return true;
  });

  const handleAddNote = async (anomaly: Anomaly) => {
    setSelectedAnomaly(anomaly);
    setNoteText(anomaly.notes || "");
    setShowDetail(true);
    
    try {
      let records: ArrivalRecord[] = [];
      if (anomaly.tripId) {
        records = await api.getArrivals({ tripId: anomaly.tripId }) as ArrivalRecord[];
      } else if (anomaly.stationId) {
        records = (await api.getArrivals({ routeId: anomaly.routeId, stationId: anomaly.stationId }) as ArrivalRecord[]).slice(0, 20);
      } else {
        records = (await api.getArrivals({ routeId: anomaly.routeId }) as ArrivalRecord[]).slice(0, 20);
      }
      setDetailRecords(records);
    } catch (error) {
      console.error("加载明细数据失败:", error);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedAnomaly || !noteText.trim()) return;

    try {
      const updated = await api.updateAnomalyNote(selectedAnomaly.id, noteText);
      setAnomalies((prev) =>
        prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
      );
      setShowDetail(false);
      setSelectedAnomaly(null);
      setNoteText("");
    } catch (error) {
      console.error("保存备注失败:", error);
    }
  };

  const crowdingLabels: Record<string, string> = {
    low: "宽松",
    medium: "适中",
    high: "拥挤",
    extreme: "极度拥挤",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">
                          {typeConfig.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityConfig.color}`}>
                          {severityConfig.label}
                        </span>
                        {anomaly.resolved && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            已处理
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{anomaly.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(anomaly.timestamp).toLocaleString("zh-CN")}
                      </p>
                      {anomaly.notes && (
                        <p className="text-xs text-gray-600 mt-2 bg-white px-3 py-2 rounded">
                          📝 {anomaly.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddNote(anomaly)}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    {anomaly.notes ? "查看/编辑" : "添加备注"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showDetail && selectedAnomaly && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">异常详情 & 备注</h3>
                <button
                  onClick={() => {
                    setShowDetail(false);
                    setSelectedAnomaly(null);
                    setNoteText("");
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">异常信息</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-500">类型：</span>
                    <span className="font-medium">{typeLabels[selectedAnomaly.type]?.label}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">严重程度：</span>
                    <span className="font-medium">{severityLabels[selectedAnomaly.severity]?.label}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">描述：</span>
                    <span className="font-medium">{selectedAnomaly.description}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">时间：</span>
                    <span className="font-medium">
                      {new Date(selectedAnomaly.timestamp).toLocaleString("zh-CN")}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">关联到站记录</h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-medium text-gray-600">站点</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-600">计划时间</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-600">延误</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-600">满载率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailRecords.map((record) => (
                        <tr key={record.id} className="border-b border-gray-100">
                          <td className="py-2 px-2">{record.stationName}</td>
                          <td className="py-2 px-2">{record.scheduledTime}</td>
                          <td className="py-2 px-2">
                            <span className={record.delaySeconds > 120 ? "text-red-600" : "text-green-600"}>
                              {(record.delaySeconds / 60).toFixed(1)}分钟
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                record.loadFactor >= 0.9
                                  ? "bg-red-100 text-red-700"
                                  : record.loadFactor >= 0.7
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-green-100 text-green-700"
                              }`}
                            >
                              {crowdingLabels[record.crowdingLevel]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">人工备注</h4>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="输入备注信息..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
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
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!noteText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存备注
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
