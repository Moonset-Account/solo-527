"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  Search,
  MapPin,
  Clock,
  Users,
} from "lucide-react";
import {
  getArrivalRecords,
  getTrips,
  getRoutes,
  getStations,
  getDetourInfos,
} from "@/lib/dataStore";
import type { ArrivalRecord, Trip, DetourInfo } from "@/types";

export default function DetailDataTable() {
  const [activeTab, setActiveTab] = useState<"arrivals" | "trips" | "detours">("arrivals");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRoute, setFilterRoute] = useState<string>("all");
  const [showDetourOnly, setShowDetourOnly] = useState(false);
  const [sortField, setSortField] = useState<string>("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const routes = getRoutes();
  const stations = getStations();
  const detourInfos = getDetourInfos();

  const allArrivals = getArrivalRecords();
  const allTrips = getTrips();

  const filteredArrivals = useMemo(() => {
    let data = [...allArrivals];

    if (filterRoute !== "all") {
      data = data.filter((a) => a.routeId === filterRoute);
    }

    if (showDetourOnly) {
      data = data.filter((a) => a.isDetour);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(
        (a) =>
          a.stationName.toLowerCase().includes(term) ||
          a.routeId.toLowerCase().includes(term) ||
          a.tripId.toLowerCase().includes(term)
      );
    }

    data.sort((a, b) => {
      let aVal: any = a[sortField as keyof ArrivalRecord];
      let bVal: any = b[sortField as keyof ArrivalRecord];

      if (sortField === "timestamp") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return data.slice(0, 50);
  }, [allArrivals, filterRoute, showDetourOnly, searchTerm, sortField, sortOrder]);

  const filteredTrips = useMemo(() => {
    let data = [...allTrips];

    if (filterRoute !== "all") {
      data = data.filter((t) => t.routeId === filterRoute);
    }

    if (showDetourOnly) {
      data = data.filter((t) => t.isDetour);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(
        (t) =>
          t.routeName.toLowerCase().includes(term) ||
          t.vehicleId.toLowerCase().includes(term) ||
          t.driverName.toLowerCase().includes(term)
      );
    }

    data.sort((a, b) => {
      let aVal: any = a[sortField as keyof Trip] || a.startTime;
      let bVal: any = b[sortField as keyof Trip] || b.startTime;

      if (typeof aVal === "string" && aVal.includes("T")) {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return data.slice(0, 50);
  }, [allTrips, filterRoute, showDetourOnly, searchTerm, sortField, sortOrder]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const crowdingColors: Record<string, string> = {
    low: "bg-green-100 text-green-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-orange-100 text-orange-700",
    extreme: "bg-red-100 text-red-700",
  };

  const crowdingLabels: Record<string, string> = {
    low: "宽松",
    medium: "适中",
    high: "拥挤",
    extreme: "极度拥挤",
  };

  const peakLabels: Record<string, string> = {
    morning: "早高峰",
    evening: "晚高峰",
    "off-peak": "平峰",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">明细数据</h3>
          <p className="text-sm text-gray-500 mt-1">
            查看到站记录、班次信息、临时绕行明细
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        {[
          { id: "arrivals", label: "到站记录", icon: Clock },
          { id: "trips", label: "班次信息", icon: Users },
          { id: "detours", label: "临时绕行", icon: MapPin },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === "detours" && detourInfos.length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                  {detourInfos.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索线路、站点、班次..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterRoute}
          onChange={(e) => setFilterRoute(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部线路</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showDetourOnly}
            onChange={(e) => setShowDetourOnly(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">仅显示绕行班次</span>
        </label>
      </div>

      <div className="overflow-x-auto">
        {activeTab === "arrivals" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th
                  className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("timestamp")}
                >
                  <div className="flex items-center gap-1">
                    到站时间
                    <SortIcon field="timestamp" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">线路</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">站点</th>
                <th
                  className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("delaySeconds")}
                >
                  <div className="flex items-center gap-1">
                    延误
                    <SortIcon field="delaySeconds" />
                  </div>
                </th>
                <th
                  className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("loadFactor")}
                >
                  <div className="flex items-center gap-1">
                    满载率
                    <SortIcon field="loadFactor" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">拥挤度</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">乘客数</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">展开</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredArrivals.map((record) => (
                <>
                  <tr
                    key={record.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      record.isDetour ? "bg-orange-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(record.actualTime).toLocaleString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                        style={{
                          backgroundColor:
                            routes.find((r) => r.id === record.routeId)?.color || "#3b82f6",
                        }}
                      >
                        {routes.find((r) => r.id === record.routeId)?.name || record.routeId}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {record.stationName}
                    </td>
                    <td className="px-4 py-3">
                      {record.delaySeconds > 120 ? (
                        <span className="text-red-600 font-medium">
                          +{Math.round(record.delaySeconds / 60)}分
                        </span>
                      ) : record.delaySeconds > 0 ? (
                        <span className="text-amber-600">
                          +{Math.round(record.delaySeconds / 60)}分
                        </span>
                      ) : (
                        <span className="text-green-600">准点</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {Math.round(record.loadFactor * 100)}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          crowdingColors[record.crowdingLevel]
                        }`}
                      >
                        {crowdingLabels[record.crowdingLevel]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{record.passengerCount}</td>
                    <td className="px-4 py-3">
                      {record.isDetour && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          <MapPin className="w-3 h-3" />
                          临时绕行
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          setExpandedRow(expandedRow === record.id ? null : record.id)
                        }
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {expandedRow === record.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    </td>
                  </tr>
                  {expandedRow === record.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={9} className="px-8 py-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">班次ID</span>
                            <p className="font-mono font-medium mt-1">{record.tripId}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">计划到站时间</span>
                            <p className="font-medium mt-1">
                              {new Date(record.scheduledTime).toLocaleString("zh-CN")}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">实际到站时间</span>
                            <p className="font-medium mt-1">
                              {new Date(record.actualTime).toLocaleString("zh-CN")}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">延误秒数</span>
                            <p className="font-mono font-medium mt-1">
                              {record.delaySeconds} 秒
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">是否绕行</span>
                            <p className="font-medium mt-1">
                              {record.isDetour ? "是 - 不参与准点率计算" : "否"}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "trips" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">线路</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">方向</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">发车时间</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">车辆</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">司机</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">时段</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTrips.map((trip) => (
                <tr
                  key={trip.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    trip.isDetour ? "bg-orange-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-1 rounded text-xs font-medium text-white"
                      style={{
                        backgroundColor:
                          routes.find((r) => r.id === trip.routeId)?.color || "#3b82f6",
                      }}
                    >
                      {trip.routeName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {trip.direction === "up" ? "上行" : "下行"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(trip.startTime).toLocaleString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600">{trip.vehicleId}</td>
                  <td className="px-4 py-3 text-gray-600">{trip.driverName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trip.peakPeriod === "morning"
                          ? "bg-blue-100 text-blue-700"
                          : trip.peakPeriod === "evening"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {peakLabels[trip.peakPeriod]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {trip.isDetour ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        <MapPin className="w-3 h-3" />
                        临时绕行 - {trip.detourReason}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        正常运行
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "detours" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">线路</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">班次</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">绕行原因</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">开始时间</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">结束时间</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">影响站点</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">说明</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {detourInfos.map((detour) => (
                <tr key={detour.id} className="bg-orange-50 hover:bg-orange-100">
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-1 rounded text-xs font-medium text-white"
                      style={{
                        backgroundColor:
                          routes.find((r) => r.id === detour.routeId)?.color || "#3b82f6",
                      }}
                    >
                      {routes.find((r) => r.id === detour.routeId)?.name || detour.routeId}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600 text-xs">
                    {detour.tripId}
                  </td>
                  <td className="px-4 py-3 font-medium text-orange-700">{detour.reason}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(detour.startTime).toLocaleString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(detour.endTime).toLocaleString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {detour.affectedStations.length} 个站点
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    不参与常规准点率统计
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500 text-center">
        显示前 50 条记录 · 临时绕行班次已标注，不参与常规准点率计算
      </div>
    </div>
  );
}
