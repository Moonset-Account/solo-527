module Admin
  class BatchJobsController < BaseController
    before_action :set_batch_job, only: [:show, :destroy, :cancel]

    def index
      @q = BatchJob.ransack(params[:q])
      @batch_jobs = @q.result.includes(:user).order(created_at: :desc).page(params[:page]).per(20)
    end

    def show
      respond_to do |format|
        format.html
        format.json do
          render json: {
            id: @batch_job.id,
            status: @batch_job.status,
            status_text: @batch_job.status_text,
            progress_percentage: @batch_job.progress_percentage,
            success_count: @batch_job.success_count,
            failure_count: @batch_job.failure_count,
            total_count: @batch_job.total_count,
            error_message: @batch_job.error_message,
            result_data: @batch_job.result_data
          }
        end
      end
    end

    def destroy
      @batch_job.destroy
      redirect_to admin_batch_jobs_path, notice: "任务记录已删除。"
    end

    def cancel
      if @batch_job.running?
        @batch_job.cancel!
        redirect_to [:admin, @batch_job], notice: "任务已取消。"
      else
        redirect_to [:admin, @batch_job], alert: "当前任务状态无法取消。"
      end
    end

    private

    def set_batch_job
      @batch_job = BatchJob.find(params[:id])
    end
  end
end
