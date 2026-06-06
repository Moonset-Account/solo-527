class Enrollment < ApplicationRecord
  include Audited

  belongs_to :course
  belongs_to :schedule
  belongs_to :student, class_name: 'User', foreign_key: 'student_id'
  belongs_to :material_kit, optional: true
  has_one :work, dependent: :nullify
  has_one :review, dependent: :destroy

  validates :order_no, presence: true, uniqueness: true
  validates :total_amount, numericality: { greater_than_or_equal_to: 0 }, presence: true
  validates :status, presence: true, inclusion: {
    in: %w[pending paid completed cancelled refund_requested refunded]
  }

  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :by_student, ->(student_id) { where(student_id: student_id) if student_id.present? }
  scope :by_course, ->(course_id) { where(course_id: course_id) if course_id.present? }
  scope :by_date_range, ->(start_date, end_date) {
    where(created_at: start_date..end_date) if start_date.present? && end_date.present?
  }
  scope :pending_expired, -> { where(status: 'pending').where('created_at < ?', 30.minutes.ago) }

  before_validation :generate_order_no, on: :create
  before_validation :set_default_amount, on: :create

  def generate_order_no
    self.order_no ||= "ENR#{Time.current.strftime('%Y%m%d')}#{SecureRandom.alphanumeric(6).upcase}"
  end

  def set_default_amount
    self.total_amount ||= course&.price || 0
    self.amount_paid ||= 0
  end

  def can_pay?
    status == 'pending'
  end

  def can_cancel?
    %w[pending paid].include?(status)
  end

  def can_request_refund?
    status == 'paid'
  end

  def can_approve_refund?
    status == 'refund_requested'
  end

  def can_complete?
    status == 'paid'
  end

  def pending?
    status == 'pending'
  end

  def paid?
    status == 'paid'
  end

  def completed?
    status == 'completed'
  end

  def cancelled?
    status == 'cancelled'
  end

  def refund_requested?
    status == 'refund_requested'
  end

  def refunded?
    status == 'refunded'
  end

  def pay!(payment_method = 'online')
    return false unless can_pay?

    transaction do
      update!(
        status: 'paid',
        payment_method: payment_method,
        amount_paid: total_amount,
        paid_at: Time.current
      )

      if material_kit && material_kit.sufficient_stock?
        material_kit.deduct_stock!(1)
      end
    end
    true
  end

  def cancel!
    return false unless can_cancel?

    transaction do
      if status == 'paid' && material_kit.present?
        material_kit.restock!(1)
      end
      update!(status: 'cancelled')
    end
    true
  end

  def request_refund!(reason = nil)
    return false unless can_request_refund?

    update!(
      status: 'refund_requested',
      refund_reason: reason,
      refund_requested_at: Time.current
    )
    true
  end

  def approve_refund!
    return false unless can_approve_refund?

    transaction do
      material_kit&.restock!(1)
      update!(
        status: 'refunded',
        refund_approved_at: Time.current
      )
    end
    true
  end

  def reject_refund!(reason = nil)
    return false unless status == 'refund_requested'

    update!(
      status: 'paid',
      reject_reason: reason
    )
    true
  end

  def complete!
    return false unless can_complete?

    update!(status: 'completed', completed_at: Time.current)
    true
  end

  def self.expire_pending_orders
    pending_expired.each do |enrollment|
      enrollment.update!(status: 'cancelled')
      Rails.logger.info "Expired pending enrollment ##{enrollment.id}"
    end
  end
end
