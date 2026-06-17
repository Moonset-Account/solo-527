class Admin::AuditLogsController < ApplicationController
  layout "admin"

  def index
    @audit_logs = AuditLog.includes(:auditable).recent
    @audit_logs = @audit_logs.by_auditable(params[:auditable_type], params[:auditable_id]) if params[:auditable_type].present?
    @audit_logs = @audit_logs.by_action(params[:action_type]) if params[:action_type].present?
    @audit_logs = @audit_logs.date_range(params[:start_date], params[:end_date])
    @audit_logs = @audit_logs.page(params[:page]).per(50)
  end

  def show
    @audit_log = AuditLog.find(params[:id])
  end
end
