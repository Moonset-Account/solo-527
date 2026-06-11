class DashboardController < ApplicationController
  def index
    @today = Date.today
    @doctors = Doctor.active.includes(:time_slots)

    @today_appointments = Appointment.on_date(@today)
    @today_waiting_count = WaitingList.waiting.where(created_at: @today.all_day).count
    @today_converted_count = Appointment.on_date(@today).from_waiting_list.count

    @upcoming_slots = TimeSlot.on_date(@today).includes(:doctor, :waiting_lists).order(:start_time)

    @recent_waiting_lists = WaitingList.includes(:customer, :doctor, :time_slot)
                                       .order(created_at: :desc)
                                       .limit(20)

    @recent_appointments = Appointment.includes(:customer, :doctor, :time_slot)
                                      .order(created_at: :desc)
                                      .limit(20)
  end
end
