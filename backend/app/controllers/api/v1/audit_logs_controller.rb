class Api::V1::AuditLogsController < Api::V1::BaseController
  def index
    authorize_admin!
    logs = AuditLog.recent
    logs = logs.by_user(params[:user_id]) if params[:user_id].present?
    logs = logs.by_action(params[:action_type]) if params[:action_type].present?
    logs = logs.by_auditable(params[:auditable_type], params[:auditable_id]) if params[:auditable_type].present?
    logs = logs.in_date_range(params[:start_date], params[:end_date]) if params[:start_date].present?
    logs = logs.page(params[:page]).per(params[:per_page] || 30)

    render json: {
      audit_logs: logs.as_json(
        include: {
          user: { only: [:id, :name, :role] }
        }
      ),
      meta: pagination_meta(logs)
    }, status: :ok
  end

  def export
    authorize_admin!
    logs = AuditLog.recent
    logs = logs.in_date_range(params[:start_date], params[:end_date]) if params[:start_date].present?

    columns = [
      { label: '操作时间', value: ->(l) { l.created_at.strftime('%Y-%m-%d %H:%M:%S') } },
      { label: '操作人', value: ->(l) { l.user&.name || '系统' } },
      { label: '操作类型', value: :action },
      { label: '对象类型', value: :auditable_type },
      { label: '对象ID', value: :auditable_id },
      { label: 'IP地址', value: :ip_address },
      { label: '备注', value: :comment }
    ]

    export_to_csv(logs, '审计日志', columns)
  end

end
