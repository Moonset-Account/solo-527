class Payment < ApplicationRecord
  has_paper_trail

  belongs_to :user
  belongs_to :payable, polymorphic: true

  scope :by_status, ->(status) { where(status: status) }
  scope :successful, -> { where(status: "paid") }
  scope :failed, -> { where(status: "failed") }
  scope :pending, -> { where(status: "pending") }
  scope :recent, -> { order(created_at: :desc) }

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :status, inclusion: { in: %w[pending paid failed refunded cancelled] }
  validates :payment_method, inclusion: { in: %w[alipay wechat bank_transfer cash card], allow_nil: true }

  def mark_paid!(transaction_id = nil, method = nil)
    update!(
      status: "paid",
      transaction_id: transaction_id,
      payment_method: method,
      paid_at: Time.current
    )
    payable&.mark_paid!(self) if payable&.respond_to?(:mark_paid!)
  end

  def mark_failed!(reason = nil)
    update!(
      status: "failed",
      failure_reason: reason,
      failed_at: Time.current,
      retry_count: retry_count + 1
    )
    if payable.is_a?(CourseEnrollment)
      CourseFillRateReportJob.perform_async(payable.course_id)
    end
  end

  def retry_payment!
    return unless failed? || cancelled?

    update!(status: "pending")
    PaymentProcessingJob.perform_async(id)
  end

  def source_description
    "#{payable&.source_description || payable_type} - 支付(#{status_text})"
  end

  def status_text
    case status
    when "pending" then "待支付"
    when "paid" then "已支付"
    when "failed" then "失败"
    when "refunded" then "已退款"
    when "cancelled" then "已取消"
    else status
    end
  end

  def paid?
    status == "paid"
  end

  def failed?
    status == "failed"
  end

  def pending?
    status == "pending"
  end
end
