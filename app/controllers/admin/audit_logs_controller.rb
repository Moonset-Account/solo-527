module Admin
  class AuditLogsController < ApplicationController
    def index
      @q = AuditLog.ransack(params[:q])
      @audit_logs = @q.result.includes(:user).order(created_at: :desc).page(params[:page]).per(30)
      authorize @audit_logs, policy_class: Admin::AuditLogPolicy
    end
  end
end
