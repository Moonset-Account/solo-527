class Admin::AttendanceController < ApplicationController
  before_action :require_login
  before_action :require_admin

  def index
    @events = Event.published.recent
    @selected_event = params[:event_id].present? ? Event.find(params[:event_id]) : @events.first
    if @selected_event
      @attendance_rate = AttendanceService.new.attendance_rate(@selected_event)
      @registrations = @selected_event.registrations.approved.includes(:attendance, :user)
      @alerts = AttendanceAlert.where(event: @selected_event).recent
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
