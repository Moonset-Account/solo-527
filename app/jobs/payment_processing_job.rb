class PaymentProcessingJob < ApplicationJob
  queue_as :default

  def perform(payment_id)
    payment = Payment.find(payment_id)
    @batch_job = BatchJob.find_by(sidekiq_jid: job_id)

    set_total(1)

    begin
      simulate_payment_gateway(payment)
      payment.mark_paid!(generate_transaction_id, "alipay")
      update_course_fill_rate(payment)
      track_success
    rescue => e
      payment.mark_failed!(e.message)
      track_failure("Payment ##{payment.id}: #{e.message}")
      PaymentRetryJob.set(wait: 10.minutes).perform_async(payment_id)
    end
  end

  private

  def simulate_payment_gateway(payment)
    sleep 1
    raise "支付网关超时" if payment.amount > 10000
  end

  def generate_transaction_id
    "TXN#{Time.current.to_i}#{rand(1000..9999)}"
  end

  def update_course_fill_rate(payment)
    return unless payment.payable.is_a?(CourseEnrollment)

    CourseFillRateReportJob.perform_async(payment.payable.course_id)
  end
end
