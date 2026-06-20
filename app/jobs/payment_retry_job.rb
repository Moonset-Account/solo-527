class PaymentRetryJob < ApplicationJob
  queue_as :default

  def perform(payment_id)
    payment = Payment.find(payment_id)
    @batch_job = BatchJob.find_by(sidekiq_jid: job_id)

    return if payment.paid?

    set_total(1)

    begin
      payment.retry_count ||= 0
      if payment.retry_count < 3
        payment.update!(retry_count: payment.retry_count + 1)
        simulate_payment_gateway(payment)
        payment.mark_paid!(generate_transaction_id, payment.payment_method)
        track_success
      else
        payment.mark_failed!("超过最大重试次数")
        track_failure("Payment ##{payment.id}: 超过最大重试次数")
      end
    rescue => e
      payment.mark_failed!(e.message)
      track_failure("Payment ##{payment.id}: #{e.message}")
    end
  end

  private

  def simulate_payment_gateway(payment)
    sleep 0.5
  end

  def generate_transaction_id
    "TXN#{Time.current.to_i}#{rand(1000..9999)}"
  end
end
