class Admin::AttendanceAlertsController < ApplicationController
  before_action :require_login
  before_action :require_admin

  def index
    @attendance_alerts = AttendanceAlert.includes(:event, :schedule).recent
    @attendance_alerts = @attendance_alerts.where(status: params[:status]) if params[:status].present?
  end

  def update
  end

  def close
    @alert = AttendanceAlert.find(params[:id])
    AlertService.new.close_alert(@alert, close_note: params[:close_note], user: current_user)
    @quality_data = AlertService.new.quality_after_close(@alert)
    redirect_to admin_attendance_alerts_path, notice: "告警已关闭，报名质量变化：到场率从 #{@quality_data[:before_rate]}% 变为 #{@quality_data[:after_rate]}%"
  end
end
