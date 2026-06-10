class Admin::RevenueAnomaliesController < ApplicationController
  before_action :require_login
  before_action :require_admin

  def index
    @anomalies = RevenueAnomaly.includes(:event, :order, :user).recent
    @anomalies = @anomalies.where(status: params[:status]) if params[:status].present?
    @anomalies = @anomalies.where(anomaly_type: params[:anomaly_type]) if params[:anomaly_type].present?
  end

  def update
  end

  def resolve
    @anomaly = RevenueAnomaly.find(params[:id])
    @anomaly.update!(status: :resolved, resolved_by: current_user, resolved_at: Time.current)
    AuditLogService.new.log(action: "anomaly_resolved", auditable: @anomaly, user: current_user)
    redirect_to admin_revenue_anomalies_path, notice: "异常已标记为已解决，责任人：#{current_user.name}"
  end
end
