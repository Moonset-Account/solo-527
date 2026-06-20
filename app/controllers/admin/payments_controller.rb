module Admin
  class PaymentsController < BaseController
    before_action :set_payment, only: [:show, :retry, :mark_paid, :refund]

    def index
      @q = Payment.ransack(params[:q])
      @payments = @q.result.includes(:user, :payable).order(created_at: :desc).page(params[:page]).per(20)
      @total_amount = Payment.paid.sum(:amount)
      @paid_count = Payment.paid.count
      @pending_count = Payment.pending.count
      @failed_count = Payment.failed.count
    end

    def show
    end

    def retry
      if @payment.failed? || @payment.pending?
        @payment.update!(status: "pending")
        PaymentProcessingJob.perform_async(@payment.id)
        redirect_to [:admin, @payment], notice: "支付重试已提交。"
      else
        redirect_to [:admin, @payment], alert: "当前支付状态无法重试。"
      end
    end

    def retry_failed
      failed_payments = Payment.failed.where("retry_count < ?", 3)
      count = failed_payments.count

      if count > 0
        batch_job = BatchJob.create!(
          job_type: "payment_retry",
          user: current_user,
          status: "pending",
          total_count: count
        )

        failed_payments.find_each do |payment|
          payment.update!(status: "pending", retry_count: payment.retry_count + 1)
          PaymentProcessingJob.perform_async(payment.id)
        end

        batch_job.update!(status: "completed", success_count: count, total_count: count)
        redirect_to admin_payments_path(q: { status_eq: "pending" }), notice: "已提交 #{count} 笔失败支付的重试任务。"
      else
        redirect_to admin_payments_path, alert: "没有可重试的失败支付。"
      end
    end

    def mark_paid
      @payment.mark_paid!(params[:transaction_id], params[:payment_method])
      CourseFillRateReportJob.perform_async(@payment.payable.course_id) if @payment.payable.is_a?(CourseEnrollment)
      redirect_to [:admin, @payment], notice: "支付已标记为成功。满班率报表将自动更新。"
    end

    def refund
      if @payment.paid?
        @payment.update!(status: "refunded")
        CourseFillRateReportJob.perform_async(@payment.payable.course_id) if @payment.payable.is_a?(CourseEnrollment)
        redirect_to [:admin, @payment], notice: "支付已退款。"
      else
        redirect_to [:admin, @payment], alert: "只有已支付的订单可以退款。"
      end
    end

    def export
      batch_job = BatchJob.create!(
        job_type: "export_data",
        user: current_user,
        status: "pending"
      )

      jid = DataExportJob.perform_async("payments", params.to_unsafe_h.slice(:q))
      batch_job.update!(sidekiq_jid: jid)

      redirect_to admin_batch_job_path(batch_job), notice: "导出任务已提交。"
    end

    private

    def set_payment
      @payment = Payment.find(params[:id])
    end
  end
end
