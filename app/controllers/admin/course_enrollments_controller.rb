module Admin
  class CourseEnrollmentsController < BaseController
    before_action :set_enrollment, only: [:show, :confirm, :cancel]

    def index
      @q = CourseEnrollment.ransack(params[:q])
      @enrollments = @q.result.includes(:user, :course).order(created_at: :desc).page(params[:page]).per(20)
    end

    def show
      @versions = @enrollment.versions.reorder(created_at: :desc).limit(20)
      @leave_requests = @enrollment.leave_requests.order(created_at: :desc)
      @payments = @enrollment.payments.order(created_at: :desc)
      @check_ins = @enrollment.check_ins.order(created_at: :desc)
    end

    def confirm
      @enrollment.confirm!
      redirect_to [:admin, @enrollment], notice: "报名已确认。"
    end

    def cancel
      @enrollment.cancel!
      redirect_to [:admin, @enrollment], notice: "报名已取消。"
    end

    def export
      batch_job = BatchJob.create!(
        job_type: "export_data",
        user: current_user,
        status: "pending"
      )

      jid = DataExportJob.perform_async("course_enrollments", params.to_unsafe_h.slice(:q))
      batch_job.update!(sidekiq_jid: jid)

      redirect_to admin_batch_job_path(batch_job), notice: "导出任务已提交。"
    end

    private

    def set_enrollment
      @enrollment = CourseEnrollment.find(params[:id])
    end
  end
end
