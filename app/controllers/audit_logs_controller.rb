class AuditLogsController < ApplicationController
  def index
    authorize AuditLog
    @q = AuditLog.includes(:ticket, :user).ransack(params[:q])
    @audit_logs = @q.result.recent.page(params[:page]).per(50)
  end
end
