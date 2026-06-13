import { createClient } from "@/lib/supabase/server";
import BookingsClient from "./BookingsClient";
import type { Booking } from "@/lib/types";

export default async function ManagerBookingsPage() {
  const supabase = createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, court:court_id(*), user:user_id(*)")
    .order("booking_date", { ascending: false })
    .order("start_time", { ascending: false });

  const bookingsData = (bookings as Booking[]) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">预约管理</h1>
        <p className="text-sm text-slate-500 mt-1">
          共 {bookingsData.length} 条预约记录
        </p>
      </div>

      <BookingsClient bookings={bookingsData} />
    </div>
  );
}
