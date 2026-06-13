"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createBooking } from "@/app/actions";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  formatCurrency,
  formatDate,
  formatTime,
  calculatePrice,
} from "@/lib/utils";
import type { Court, Schedule, PricingRule } from "@/lib/types";

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const preScheduleId = searchParams.get("schedule");
  const preCourtId = searchParams.get("court");
  const preDate = searchParams.get("date");
  const preTime = searchParams.get("time");

  const [courts, setCourts] = useState<Court[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string>(preCourtId ?? "");
  const [selectedSchedule, setSelectedSchedule] = useState<string>(
    preScheduleId ?? ""
  );
  const [date, setDate] = useState<string>(
    preDate ?? new Date().toISOString().split("T")[0] ?? ""
  );
  const [startTime, setStartTime] = useState<string>(preTime ?? "09:00");
  const [endTime, setEndTime] = useState<string>(preTime ? addHour(preTime) : "10:00");
  const [guests, setGuests] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  function addHour(t: string): string {
    const [h, m] = t.split(":").map(Number);
    const newH = Math.min((h ?? 0) + 1, 22);
    return `${String(newH).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}`;
  }

  useEffect(() => {
    async function loadData() {
      const [courtsRes, pricingRes] = await Promise.all([
        supabase.from("courts").select("*").eq("is_active", true).order("code"),
        supabase.from("pricing_rules").select("*").eq("is_active", true),
      ]);
      setCourts((courtsRes.data as Court[]) ?? []);
      setPricingRules((pricingRes.data as PricingRule[]) ?? []);
    }
    loadData();
  }, [supabase]);

  useEffect(() => {
    if (!date) return;
    async function loadSchedules() {
      const { data } = await supabase
        .from("schedules")
        .select("*, coach:coach_id(*)")
        .eq("date", date)
        .order("start_time");
      setSchedules((data as Schedule[]) ?? []);
    }
    loadSchedules();
  }, [date, supabase]);

  useEffect(() => {
    if (preScheduleId && schedules.length > 0) {
      const s = schedules.find((x) => x.id === preScheduleId);
      if (s) {
        setSelectedCourt(s.court_id);
        setStartTime(s.start_time.slice(0, 5));
        setEndTime(s.end_time.slice(0, 5));
      }
    }
  }, [preScheduleId, schedules]);

  const estimatedPrice = calculatePrice(
    pricingRules,
    date,
    `${startTime}:00`,
    `${endTime}:00`
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      if (selectedSchedule) {
        formData.append("schedule_id", selectedSchedule);
      }
      formData.append("court_id", selectedCourt);
      formData.append("booking_date", date);
      formData.append("start_time", `${startTime}:00`);
      formData.append("end_time", `${endTime}:00`);
      formData.append("guests_count", String(guests));
      formData.append("total_price", String(estimatedPrice));

      const result = await createBooking(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/bookings");
      }
    } catch (err) {
      setError("预约失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  const currentCourt = courts.find((c) => c.id === selectedCourt);
  const timeOptions = [];
  for (let h = 8; h <= 21; h++) {
    timeOptions.push(`${String(h).padStart(2, "0")}:00`);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/bookings"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← 返回我的预约
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">新建预约</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-800">基本信息</h3>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label">选择场地</label>
              <select
                className="input"
                value={selectedCourt}
                onChange={(e) => setSelectedCourt(e.target.value)}
                required
              >
                <option value="">请选择场地</option>
                {courts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}（容纳{c.capacity}人）
                  </option>
                ))}
              </select>
            </div>

            {schedules.length > 0 && (
              <div>
                <label className="label">选择排班（可选）</label>
                <select
                  className="input"
                  value={selectedSchedule}
                  onChange={(e) => {
                    setSelectedSchedule(e.target.value);
                    const s = schedules.find((x) => x.id === e.target.value);
                    if (s) {
                      setSelectedCourt(s.court_id);
                      setStartTime(s.start_time.slice(0, 5));
                      setEndTime(s.end_time.slice(0, 5));
                    }
                  }}
                >
                  <option value="">不选择排班，直接预约场地</option>
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatTime(s.start_time)}-{formatTime(s.end_time)} {s.title ?? s.schedule_type}
                      {s.coach?.name ? ` - ${s.coach.name}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="label">日期</label>
                <input
                  type="date"
                  className="input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div>
                <label className="label">开始时间</label>
                <select
                  className="input"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    if (e.target.value >= endTime) {
                      const [h] = e.target.value.split(":").map(Number);
                      setEndTime(
                        `${String(Math.min((h ?? 9) + 1, 22)).padStart(2, "0")}:00`
                      );
                    }
                  }}
                  required
                >
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">结束时间</label>
                <select
                  className="input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                >
                  {timeOptions
                    .filter((t) => t > startTime)
                    .concat(["22:00"])
                    .map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">同行人数（含自己）</label>
              <input
                type="number"
                min={1}
                max={currentCourt?.capacity ?? 20}
                className="input"
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                required
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-800">费用明细</h3>
          </div>
          <div className="card-body space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">
                {formatDate(date)} {startTime} - {endTime}
              </span>
              <span className="text-slate-800">
                {currentCourt ? `${currentCourt.code} ${currentCourt.name}` : "未选择场地"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">时长</span>
              <span className="text-slate-800">
                {(
                  (parseInt(endTime.split(":")[0] ?? "0") -
                    parseInt(startTime.split(":")[0] ?? "0")) *
                  60 +
                  (parseInt(endTime.split(":")[1] ?? "0") -
                    parseInt(startTime.split(":")[1] ?? "0"))
                ) / 60}{" "}
                小时
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">同行人数</span>
              <span className="text-slate-800">{guests} 人</span>
            </div>
            <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-end">
              <span className="font-medium text-slate-800">应付金额</span>
              <span className="text-3xl font-bold text-emerald-600">
                {formatCurrency(estimatedPrice)}
              </span>
            </div>
          </div>
          <div className="card-footer">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Link href="/bookings" className="btn-secondary justify-center">
                取消
              </Link>
              <button
                type="submit"
                disabled={loading || !selectedCourt}
                className="btn-primary justify-center"
              >
                {loading ? "提交中..." : "提交预约（稍后支付）"}
              </button>
            </div>
            {error && (
              <div className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                {error}
              </div>
            )}
            <p className="mt-4 text-xs text-slate-500">
              提示：预约成功后请在 15 分钟内完成支付，否则订单会自动取消。如遇时间冲突，负责人会与您联系协调。
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
