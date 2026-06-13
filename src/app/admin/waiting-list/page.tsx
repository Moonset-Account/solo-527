"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  removeFromWaitingList,
  convertWaitingToBooking,
  notifyWaitingListUser,
} from "@/app/actions";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
} from "@/lib/utils";
import type { WaitingList, Schedule, Court } from "@/lib/types";

export default function WaitingListPage() {
  const supabase = createClient();
  const [waitingLists, setWaitingLists] = useState<WaitingList[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [scheduleFilter, setScheduleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertData, setConvertData] = useState({
    schedule_id: "",
    court_id: "",
    total_price: 50,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [wlRes, schedRes, courtsRes] = await Promise.all([
        supabase
          .from("waiting_lists")
          .select("*, schedule:schedule_id(*, court:court_id(*), coach:coach_id(*)), user:user_id(*)")
          .order("created_at", { ascending: false }),
        supabase
          .from("schedules")
          .select("*")
          .gte("date", new Date().toISOString().split("T")[0] ?? "")
          .order("date")
          .order("start_time"),
        supabase.from("courts").select("*").order("code"),
      ]);
      setWaitingLists((wlRes.data as WaitingList[]) ?? []);
      setSchedules((schedRes.data as Schedule[]) ?? []);
      setCourts((courtsRes.data as Court[]) ?? []);
    } catch (e) {
      setError("加载数据失败");
    } finally {
      setLoading(false);
    }
  }

  function closeModals() {
    setConvertingId(null);
    setError("");
    setSuccess("");
  }

  async function handleRemove(id: string) {
    if (!confirm("确定要从此候补名单中移除吗？")) return;
    const result = await removeFromWaitingList(id);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("已从候补名单移除");
      loadData();
    }
  }

  async function handleNotify(id: string) {
    const result = await notifyWaitingListUser(id);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("已标记为已通知");
      loadData();
    }
  }

  function openConvertModal(entry: WaitingList) {
    setConvertingId(entry.id);
    setConvertData({
      schedule_id: entry.schedule_id,
      court_id: entry.preferred_court_id ?? entry.schedule?.court_id ?? "",
      total_price: 50,
    });
  }

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    if (!convertingId) return;

    const fd = new FormData();
    if (convertData.schedule_id) fd.append("schedule_id", convertData.schedule_id);
    if (convertData.court_id) fd.append("court_id", convertData.court_id);
    fd.append("total_price", String(convertData.total_price));

    const result = await convertWaitingToBooking(convertingId, fd);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("候补已成功转为预约");
      closeModals();
      loadData();
    }
  }

  const filteredLists = waitingLists.filter((entry) => {
    if (scheduleFilter !== "all" && entry.schedule_id !== scheduleFilter) {
      return false;
    }
    if (statusFilter === "active" && (entry.converted || entry.notified)) return false;
    if (statusFilter === "notified" && !entry.notified) return false;
    if (statusFilter === "converted" && !entry.converted) return false;
    return true;
  });

  const statusBadgeClass = (entry: WaitingList) => {
    if (entry.converted) return "bg-green-100 text-green-800";
    if (entry.notified) return "bg-blue-100 text-blue-800";
    return "bg-amber-100 text-amber-800";
  };

  const statusName = (entry: WaitingList) => {
    if (entry.converted) return "已转预约";
    if (entry.notified) return "已通知";
    return "候补中";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">候补名单管理</h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {waitingLists.length} 条候补记录，其中{" "}
            {waitingLists.filter((w) => !w.converted).length} 条待处理
          </p>
        </div>
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

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">排班筛选</label>
          <select
            className="input max-w-xs"
            value={scheduleFilter}
            onChange={(e) => setScheduleFilter(e.target.value)}
          >
            <option value="all">全部排班</option>
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {formatDate(s.date)} {formatTime(s.start_time)} {s.title ?? s.schedule_type}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">状态</label>
          <div className="flex gap-1">
            {[
              { value: "all", label: "全部" },
              { value: "active", label: "候补中" },
              { value: "notified", label: "已通知" },
              { value: "converted", label: "已转预约" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === f.value
                    ? "bg-primary-600 text-white"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-16 text-slate-500">加载中...</div>
      ) : filteredLists.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            暂无候补记录
          </h3>
          <p className="text-sm text-slate-500">
            当前筛选条件下没有候补名单
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLists.map((entry) => (
            <div key={entry.id} className="card overflow-hidden">
              <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  #{entry.position}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-semibold text-slate-800">
                      {entry.user?.full_name ?? "未知用户"}
                    </span>
                    {entry.user?.phone && (
                      <span className="text-xs text-slate-500">
                        {entry.user.phone}
                      </span>
                    )}
                    <span className={`badge ${statusBadgeClass(entry)}`}>
                      {statusName(entry)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-sm">
                    <div>
                      <span className="text-slate-500">排班日期：</span>
                      <span className="text-slate-700">
                        {entry.schedule?.date
                          ? formatDate(entry.schedule.date)
                          : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">时间：</span>
                      <span className="text-slate-700">
                        {entry.schedule?.start_time
                          ? `${formatTime(entry.schedule.start_time)} - ${formatTime(entry.schedule.end_time)}`
                          : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">排班：</span>
                      <span className="text-slate-700">
                        {entry.schedule?.title ?? entry.schedule?.schedule_type ?? "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">场地：</span>
                      <span className="text-slate-700">
                        {entry.preferred_court_id && courts.find(c => c.id === entry.preferred_court_id)
                          ? `${courts.find(c => c.id === entry.preferred_court_id)?.code} - ${courts.find(c => c.id === entry.preferred_court_id)?.name}`
                          : entry.schedule?.court?.code
                            ? `${entry.schedule.court.code} - ${entry.schedule.court.name}`
                            : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">候补位置：</span>
                      <span className="text-amber-600 font-medium">
                        第 {entry.position} 位
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">加入时间：</span>
                      <span className="text-slate-700">
                        {formatDateTime(entry.created_at)}
                      </span>
                    </div>
                  </div>
                  {entry.notified_at && (
                    <div className="text-xs text-slate-400 mt-1">
                      通知时间：{formatDateTime(entry.notified_at)}
                    </div>
                  )}
                  {new Date(entry.expires_at) < new Date() && !entry.converted && (
                    <div className="text-xs text-red-500 mt-1">
                      ⚠️ 候补已过期（有效期至 {formatDate(entry.expires_at)}）
                    </div>
                  )}
                </div>
                <div className="flex lg:flex-col gap-2 items-stretch lg:min-w-[180px]">
                  {!entry.converted && !entry.notified && (
                    <button
                      onClick={() => handleNotify(entry.id)}
                      className="btn-secondary text-sm py-1.5 px-3"
                    >
                      ✓ 标记已通知
                    </button>
                  )}
                  {!entry.converted && (
                    <button
                      onClick={() => openConvertModal(entry)}
                      className="btn-success text-sm py-1.5 px-3"
                    >
                      转为预约
                    </button>
                  )}
                  {!entry.converted && (
                    <button
                      onClick={() => handleRemove(entry.id)}
                      className="btn-danger text-sm py-1.5 px-3"
                    >
                      移除
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {convertingId && (
        <div className="modal-backdrop" onClick={closeModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleConvert} className="flex flex-col h-full">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">
                  候补转正式预约
                </h3>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="label">选择排班</label>
                  <select
                    className="input"
                    value={convertData.schedule_id}
                    onChange={(e) =>
                      setConvertData({
                        ...convertData,
                        schedule_id: e.target.value,
                      })
                    }
                  >
                    <option value="">使用原排班</option>
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {formatDate(s.date)} {formatTime(s.start_time)}-
                        {formatTime(s.end_time)} {s.title ?? s.schedule_type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">选择场地</label>
                  <select
                    className="input"
                    value={convertData.court_id}
                    onChange={(e) =>
                      setConvertData({
                        ...convertData,
                        court_id: e.target.value,
                      })
                    }
                  >
                    <option value="">自动分配</option>
                    {courts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">收取金额（元）</label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    className="input"
                    value={convertData.total_price}
                    onChange={(e) =>
                      setConvertData({
                        ...convertData,
                        total_price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    实收金额：{formatCurrency(convertData.total_price)}
                  </p>
                </div>
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
                  确认转换
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
