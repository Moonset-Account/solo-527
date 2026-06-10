class Admin::AuditLogsController < ApplicationController
  before_action :require_login
  before_action :require_admin

  def index
    @audit_logs = AuditLog.includes(:user).recent
    @audit_logs = @audit_logs.where(user_id: params[:user_id]) if params[:user_id].present?
    @audit_logs = @audit_logs.where(action: params[:action_type]) if params[:action_type].present?
    @audit_logs = @audit_logs.where.not(anomaly_type: nil) if params[:anomaly] == "true"
  end

  def show
    @audit_log = AuditLog.includes(:user).find(params[:id])
  end
end
