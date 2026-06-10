class Admin::BatchOperationsController < ApplicationController
  before_action :require_login
  before_action :require_admin

  def index
    @batch_operations = BatchOperation.includes(:user).recent
  end

  def create
    service = BatchOperationService.new(current_user)
    @batch_op = service.execute(
      operation_type: params[:operation_type],
      target_type: params[:target_type],
      target_ids: params[:target_ids]
    )
    redirect_to admin_batch_operation_path(@batch_op), notice: "批量操作已提交"
  end

  def show
    @batch_op = BatchOperation.includes(:user, audit_logs: :user).find(params[:id])
  end
end
