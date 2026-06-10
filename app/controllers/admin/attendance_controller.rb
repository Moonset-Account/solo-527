class Admin::AttendanceController < ApplicationController
  before_action :require_login
  before_action :require_admin

  def index
    @events = Event.published.recent
    @selected_event = params[:event_id].present? ? Event.find(params[:event_id]) : @events.first
    if @selected_event
      @attendance_rate = AttendanceService.new.attendance_rate(@selected_event)
      @registrations = @selected_event.registrations.approved.includes(:attendance, :user, :schedule, :event)
      @attendances = Attendance.where(registration: @selected_event.registrations.approved)
        .includes(registration: [:user, :schedule, :event])
        .order(created_at: :desc)
      @alerts = AttendanceAlert.where(event: @selected_event).recent
      @open_alerts_count = @alerts.open.count
    else
      @attendances = Attendance.none
      @open_alerts_count = 0
    end
  end

  def update
  end

  def check_in
    registration = Registration.find(params[:registration_id])
    AttendanceService.new.check_in(registration, checked_in_by: current_user.name)
    redirect_to admin_attendance_index_path(event_id: registration.event_id), notice: "签到成功"
  rescue => e
    redirect_back fallback_location: admin_attendance_index_path, alert: e.message
  end
end
