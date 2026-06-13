"use client";

import { useState } from "react";
import { cancelBooking } from "@/app/actions";
import { useRouter } from "next/navigation";
import type { Booking } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  getBookingStatusColor,
  getBookingStatusName,
  getPaymentStatusColor,
  getPaymentStatusName,
} from "@/lib/utils";

interface Props {
  bookings: Booking[];
}

export default function BookingsClient({ bookings }: Props) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const filteredBookings =
    statusFilter === "all"
      ? bookings
      : bookings.filter((b) => b.status === statusFilter);

  const statusFilters = [
    { value: "all", label: "全部", count: bookings.length },
    { value: "pending", label: "待支付", count: bookings.filter((b) => b.status === "pending").length },
    { value: "confirmed", label: "已确认", count: bookings.filter((b) => b.status === "confirmed").length },
    { value: "conflict", label: "有冲突", count: bookings.filter((b) => b.status === "conflict").length },
    { value: "completed", label: "已完成", count: bookings.filter((b) => b.status === "completed").length },
    { value: "cancelled", label: "已取消", count: bookings.filter((b) => b.status === "cancelled").length },
  ];

  async function handleCancel(bookingId: string) {
    if (!confirm("确定要取消此预约吗？")) return;
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      router.refresh();
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === filter.value
                ? "bg-primary-600 text-white"
                : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {filter.label}
            <span
              className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                statusFilter === filter.value
                  ? "bg-white/20"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {filteredBookings.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            暂无预约记录
          </h3>
          <p className="text-sm text-slate-500">
            当前筛选条件下没有预约
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="card overflow-hidden">
              <div className="p-5 flex flex-col lg:flex-row gap-4">
                <div className="w-full lg:w-16 h-16 rounded-xl bg-gradient-to-br from-court-green to-emerald-700 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {booking.court?.code ?? "场"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-slate-800">
                      {booking.court?.name ?? "场地"}
                    </h3>
                    <span className={`badge ${getBookingStatusColor(booking.status)}`}>
                      {getBookingStatusName(booking.status)}
                    </span>
                    <span className={`badge ${getPaymentStatusColor(booking.payment_status)}`}>
                      {getPaymentStatusName(booking.payment_status)}
                    </span>
                    {booking.has_conflict && (
                      <span className="badge bg-red-100 text-red-800">
                        ⚠️ 有冲突
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-sm">
                    <div className="flex gap-2">
                      <span className="text-slate-500 w-20 flex-shrink-0">预约用户</span>
                      <span className="text-slate-700">
                        {booking.user?.full_name ?? "未知"}
                        {booking.user?.phone && (
                          <span className="text-slate-500 ml-2">
                            ({booking.user.phone})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-500 w-20 flex-shrink-0">日期</span>
                      <span className="text-slate-700">
                        {formatDate(booking.booking_date)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-500 w-20 flex-shrink-0">时间</span>
                      <span className="text-slate-700">
                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-500 w-20 flex-shrink-0">人数</span>
                      <span className="text-slate-700">{booking.guests_count} 人</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-500 w-20 flex-shrink-0">金额</span>
                      <span className="text-emerald-600 font-medium">
                        {formatCurrency(booking.total_price)}
                      </span>
                    </div>
                    {booking.paid_at && (
                      <div className="flex gap-2">
                        <span className="text-slate-500 w-20 flex-shrink-0">支付时间</span>
                        <span className="text-slate-700">
                          {formatDateTime(booking.paid_at)}
                        </span>
                      </div>
                    )}
                  </div>

                  {booking.notes && (
                    <div className="mt-2 text-sm">
                      <span className="text-slate-500">备注：</span>
                      <span className="text-slate-600">{booking.notes}</span>
                    </div>
                  )}
                  {booking.transaction_id && (
                    <div className="mt-1 text-xs text-slate-400">
                      订单号：{booking.transaction_id}
                    </div>
                  )}
                </div>
                <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 lg:gap-2 lg:min-w-[100px]">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">合计</div>
                    <div className="text-xl font-bold text-emerald-600">
                      {formatCurrency(booking.total_price)}
                    </div>
                  </div>
                  {booking.status !== "cancelled" &&
                    booking.status !== "completed" && (
                      <button
                        className="btn-secondary text-red-600 text-sm py-1.5 px-3"
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancellingId === booking.id}
                      >
                        {cancellingId === booking.id ? "取消中..." : "取消预约"}
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
