module Admin
  class FailedBatchesController < ApplicationController
    before_action :set_failed_batch, only: [:show, :update, :retry, :resolve]

    def index
      @q = FailedBatch.ransack(params[:q])
      @failed_batches = @q.result.includes(:work_order, :process_step, :resolved_by)
        .order(created_at: :desc).page(params[:page]).per(20)
      authorize @failed_batches, policy_class: Admin::FailedBatchPolicy
    end

    def show
      authorize @failed_batch, policy_class: Admin::FailedBatchPolicy
    end

    def update
      authorize @failed_batch, policy_class: Admin::FailedBatchPolicy
      if @failed_batch.update(failed_batch_params)
        redirect_to admin_failed_batches_path, notice: "失败批次已更新。"
      else
        render :show
      end
    end

    def retry
      authorize @failed_batch, policy_class: Admin::FailedBatchPolicy
      handler = FailedBatchHandler.new(@failed_batch.work_order, @failed_batch.process_step)
      begin
        handler.retry!(@failed_batch, current_user) do |payload|
          ProcessStepSyncJob.perform_now(@failed_batch.work_order_id, @failed_batch.process_step_id, payload)
        end
        redirect_to admin_failed_batches_path, notice: "失败批次重试成功。"
      rescue => e
        redirect_to admin_failed_batches_path, alert: "重试失败: #{e.message}"
      end
    end

    def resolve
      authorize @failed_batch, policy_class: Admin::FailedBatchPolicy
      handler = FailedBatchHandler.new(@failed_batch.work_order, @failed_batch.process_step)
      handler.resolve!(@failed_batch, current_user)
      redirect_to admin_failed_batches_path, notice: "已标记为已解决。"
    end

    private

    def set_failed_batch
      @failed_batch = FailedBatch.find(params[:id])
    end

    def failed_batch_params
      params.require(:failed_batch).permit(:status, :error_message)
    end
  end
end
