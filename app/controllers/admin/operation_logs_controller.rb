class Admin::OperationLogsController < Admin::BaseController
  def index
    @q = policy_scope(OperationLog).ransack(params[:q])
    @operation_logs = @q.result.includes(:user, :target).order(created_at: :desc).page(params[:page]).per(20)
    authorize @operation_logs
  end
end
