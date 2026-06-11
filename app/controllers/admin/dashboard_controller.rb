module Admin
  class DashboardController < ApplicationController
    def index
      @today = Date.today
      @week_start = @today.beginning_of_week
      @month_start = @today.beginning_of_month

      @doctors = Doctor.active.includes(:time_slots)

      @daily_stats = {
        appointments: Appointment.on_date(@today).count,
        completed: Appointment.on_date(@today).completed.count,
        no_shows: Appointment.on_date(@today).no_show.count,
        waiting_added: WaitingList.where(created_at: @today.all_day).count,
        converted: Appointment.on_date(@today).from_waiting_list.count,
        refund_count: RefundRecord.on_date(@today).count,
        refund_amount: RefundRecord.on_date(@today).processed.sum(:refund_amount)
      }

      @conversion_rate = calculate_conversion_rate(@month_start, @today)
      @no_show_rate = calculate_no_show_rate(@month_start, @today)
    end

    private

    def calculate_conversion_rate(start_date, end_date)
      total = WaitingList.where(created_at: start_date.all_day..end_date.all_day).count
      converted = Appointment.where(from_waiting_list: true, created_at: start_date.all_day..end_date.all_day).count
      return 0 if total == 0
      (converted.to_f / total * 100).round(1)
    end

    def calculate_no_show_rate(start_date, end_date)
      total = Appointment.where(appointment_date: start_date..end_date)
                         .where.not(status: ["cancelled", "pending"]).count
      no_shows = Appointment.on_date(start_date..end_date).no_show.count
      return 0 if total == 0
      (no_shows.to_f / total * 100).round(1)
    end
  end
end
