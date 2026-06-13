import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/actions";
import Link from "next/link";
import {
  formatCurrency,
  formatDate,
  formatTime,
  generateWeekDates,
  getDayOfWeekName,
} from "@/lib/utils";
import type { Court, Schedule, Coach, PricingRule } from "@/lib/types";

export default async function HomePage() {
  const user = await getCurrentUser();
  const supabase = createClient();

  const [courtsResult, coachesResult, pricingResult] = await Promise.all([
    supabase
      .from("courts")
      .select("*")
      .eq("is_active", true)
      .order("code"),
    supabase
      .from("coaches")
      .select("*")
      .eq("is_active", true)
      .order("name"),
    supabase.from("pricing_rules").select("*").eq("is_active", true),
  ]);

  const courts: Court[] = courtsResult.data ?? [];
  const coaches: Coach[] = coachesResult.data ?? [];
  const pricingRules: PricingRule[] = pricingResult.data ?? [];

  const weekDates = generateWeekDates();
  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00",
    "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
  ];

  const { data: schedules } = await supabase
    .from("schedules")
    .select("*, court:court_id(*), coach:coach_id(*)")
    .gte("date", weekDates[0])
    .lte("date", weekDates[6])
    .order("date")
    .order("start_time");

  const scheduleData = (schedules as Schedule[]) ?? [];

  const getSchedulesForSlot = (courtId: string, date: string, time: string) => {
    const timeWithSeconds = `${time}:00`;
    return scheduleData.filter(
      (s) =>
        s.court_id === courtId &&
        s.date === date &&
        s.start_time <= timeWithSeconds &&
        s.end_time > timeWithSeconds
    );
  };

  if (!user) {
    return (
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-50 via-white to-sky-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 tracking-tight">
                告别混乱的
                <span className="text-emerald-600"> 表格和群消息</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600">
                一站式羽毛球馆场地预约、课程排班和管理平台，让场地利用更高效。
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/25"
                >
                  立即注册使用
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  登录账号
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "在线预约场地",
                desc: "实时查看场地空闲状态，快速下单预约，支持微信/支付宝支付。",
                icon: "🏸",
                color: "from-emerald-500 to-teal-500",
              },
              {
                title: "教练课程排班",
                desc: "管理员统一管理教练排班、课程配置和价格规则，操作有日志。",
                icon: "📚",
                color: "from-sky-500 to-blue-500",
              },
              {
                title: "冲突安全管理",
                desc: "负责人处理场地冲突，办结后自动同步设备安全报表。",
                icon: "🛡️",
                color: "from-amber-500 to-orange-500",
              },
            ].map((f) => (
              <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-4`}
                >
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {f.title}
                </h3>
                <p className="text-slate-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-8">
              可用场地
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {courts.map((court) => (
                <div key={court.id} className="card overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-court-green to-emerald-700 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-3xl font-bold">{court.code}</div>
                      <div className="text-sm opacity-80">{court.name}</div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                      <span>容纳 {court.capacity} 人</span>
                      <span className="text-emerald-600 font-medium">
                        {court.floor_type ?? "标准地板"}
                      </span>
                    </div>
                    {court.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {court.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                场地排班周视图
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/bookings/new"
                className="btn-primary"
              >
                + 快速预约
              </Link>
            </div>
          </div>

          <div className="card overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50">
                <div className="p-3 text-xs font-medium text-slate-500 border-r border-slate-200 sticky left-0 bg-slate-50">
                  时间 / 场地
                </div>
                {courts.slice(0, 7).map((court) => (
                  <div
                    key={court.id}
                    className="p-3 text-center border-r border-slate-200 last:border-r-0"
                  >
                    <div className="text-sm font-semibold text-slate-800">
                      {court.code}
                    </div>
                    <div className="text-xs text-slate-500">{court.name}</div>
                  </div>
                ))}
              </div>

              {weekDates.map((date, dateIdx) => (
                <div key={date}>
                  <div className="grid grid-cols-8 bg-slate-50/50 border-b border-slate-100">
                    <div className="p-2 text-xs font-medium text-slate-600 border-r border-slate-100 sticky left-0 bg-slate-50/50">
                      <div>
                        {getDayOfWeekName(new Date(date).getDay())}
                      </div>
                      <div className="text-slate-400">
                        {date.slice(5)}
                      </div>
                    </div>
                    {courts.slice(0, 7).map((_, i) => (
                      <div
                        key={i}
                        className="p-2 border-r border-slate-100 text-xs text-slate-400 text-center"
                      >
                        {dateIdx === 0 ? "点击时间格预约" : ""}
                      </div>
                    ))}
                  </div>
                  {timeSlots.map((time) => (
                    <div
                      key={`${date}-${time}`}
                      className="grid grid-cols-8 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50"
                    >
                      <div className="p-2 text-xs text-slate-500 border-r border-slate-100 sticky left-0 bg-white">
                        {time}
                      </div>
                      {courts.slice(0, 7).map((court) => {
                        const slots = getSchedulesForSlot(
                          court.id,
                          date,
                          time
                        );
                        return (
                          <div
                            key={`${court.id}-${time}`}
                            className="p-1 border-r border-slate-100 last:border-r-0 min-h-[48px]"
                          >
                            {slots[0] ? (
                              <Link
                                href={`/bookings/new?schedule=${slots[0].id}`}
                                className="block rounded-md bg-emerald-100 hover:bg-emerald-200 border border-emerald-200 p-1.5 text-xs text-emerald-800 h-full"
                              >
                                <div className="font-medium truncate">
                                  {slots[0].title ??
                                    (slots[0].schedule_type === "course"
                                      ? "课程"
                                      : slots[0].schedule_type ===
                                          "maintenance"
                                        ? "维护"
                                        : slots[0].schedule_type === "event"
                                          ? "活动"
                                          : "开放")}
                                </div>
                                {slots[0].coach?.name && (
                                  <div className="text-emerald-600 text-[10px] truncate">
                                    {slots[0].coach.name}
                                  </div>
                                )}
                              </Link>
                            ) : (
                              <Link
                                href={`/bookings/new?court=${court.id}&date=${date}&time=${time}`}
                                className="block rounded-md bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-200 p-1.5 text-xs text-slate-400 h-full flex items-center justify-center"
                              >
                                <span className="opacity-0 hover:opacity-100 text-emerald-600 font-medium transition-opacity">
                                  预约
                                </span>
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-800">价格说明</h3>
            </div>
            <div className="card-body space-y-3">
              {pricingRules.slice(0, 5).map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <div className="font-medium text-slate-700">
                      {rule.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {rule.day_of_week !== null
                        ? getDayOfWeekName(rule.day_of_week)
                        : "每日"}{" "}
                      {formatTime(rule.start_time)}-{formatTime(rule.end_time)}
                      {rule.is_peak && (
                        <span className="ml-1 text-amber-600">(高峰)</span>
                      )}
                    </div>
                  </div>
                  <div className="text-emerald-600 font-semibold">
                    {formatCurrency(rule.base_price * rule.multiplier)}/时
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-800">在馆教练</h3>
            </div>
            <div className="card-body space-y-3">
              {coaches.slice(0, 5).map((coach) => (
                <div
                  key={coach.id}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                    {coach.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">
                      {coach.name}
                    </div>
                    <div className="text-xs text-slate-500 flex gap-2">
                      <span>{coach.level}</span>
                      <span>·</span>
                      <span>{formatCurrency(coach.hourly_rate)}/时</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/bookings"
            className="btn-secondary w-full justify-center"
          >
            查看我的全部预约 →
          </Link>
        </div>
      </div>
    </div>
  );
}
