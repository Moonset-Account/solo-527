import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, cancelBooking, processPayment } from "@/app/actions";
import Link from "next/link";
import { redirect } from "next/navigation";
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
import type { Booking } from "@/lib/types";

export default async function BookingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, court:court_id(*)")
    .eq("user_id", user.id)
    .order("booking_date", { ascending: false })
    .order("start_time", { ascending: false });

  const bookingData = (bookings as Booking[]) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">我的预约</h1>
          <p className="text-sm text-slate-500 mt-1">
            共 {bookingData.length} 条预约记录
          </p>
        </div>
        <Link href="/bookings/new" className="btn-primary">
          + 新建预约
        </Link>
      </div>

      {bookingData.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🏸</div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            还没有预约记录
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            去首页查看场地排班并预约吧！
          </p>
          <Link href="/" className="btn-primary">
            浏览场地
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookingData.map((booking) => (
            <div key={booking.id} className="card">
              <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-court-green to-emerald-700 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {booking.court?.code ?? "场"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800">
                      {booking.court?.name ?? "场地"}
                    </h3>
                    <span
                      className={`badge ${getBookingStatusColor(booking.status)}`}
                    >
                      {getBookingStatusName(booking.status)}
                    </span>
                    <span
                      className={`badge ${getPaymentStatusColor(booking.payment_status)}`}
                    >
                      {getPaymentStatusName(booking.payment_status)}
                    </span>
                    {booking.has_conflict && (
                      <span className="badge bg-red-100 text-red-800">
                        ⚠️ 有冲突
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                    <span>📅 {formatDate(booking.booking_date)}</span>
                    <span>
                      🕐 {formatTime(booking.start_time)} -{" "}
                      {formatTime(booking.end_time)}
                    </span>
                    <span>👥 {booking.guests_count} 人</span>
                    {booking.paid_at && (
                      <span>💳 {formatDateTime(booking.paid_at)}</span>
                    )}
                  </div>
                  {booking.transaction_id && (
                    <div className="text-xs text-slate-400 mt-1">
                      订单号: {booking.transaction_id}
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <div className="text-right sm:mr-4">
                    <div className="text-xs text-slate-500">合计</div>
                    <div className="text-xl font-bold text-emerald-600">
                      {formatCurrency(booking.total_price)}
                    </div>
                    {booking.discount_amount > 0 && (
                      <div className="text-xs text-amber-600">
                        优惠 -{formatCurrency(booking.discount_amount)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {booking.payment_status === "unpaid" &&
                      booking.status !== "cancelled" && (
                        <form action={processPayment.bind(null, booking.id) as unknown as (formData: FormData) => Promise<void>}>
                          <button className="btn-success" type="submit">
                            去支付
                          </button>
                        </form>
                      )}
                    {booking.status !== "cancelled" &&
                      booking.status !== "completed" && (
                        <form action={cancelBooking.bind(null, booking.id) as unknown as (formData: FormData) => Promise<void>}>
                          <button
                            className="btn-secondary text-red-600"
                            type="submit"
                          >
                            取消
                          </button>
                        </form>
                      )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
