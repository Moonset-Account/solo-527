class Payment < ApplicationRecord
  enum status: { pending: 0, success: 1, failed: 2, refunded: 3 }

  belongs_to :booking
  belongs_to :student

  validates :payment_no, presence: true, uniqueness: true
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :payment_method, presence: true
  validates :status, presence: true

  scope :success, -> { where(status: :success) }
  scope :by_student, ->(student_id) { where(student_id: student_id) }
  scope :by_booking, ->(booking_id) { where(booking_id: booking_id) }
  scope :in_date_range, ->(start_date, end_date) { where(created_at: start_date.beginning_of_day..end_date.end_of_day) }

  before_validation :generate_payment_no, on: :create

  private

  def generate_payment_no
    return if payment_no.present?
    loop do
      self.payment_no = "PY#{Time.current.strftime('%Y%m%d%H%M%S')}#{SecureRandom.hex(3).upcase}"
      break unless Payment.exists?(payment_no: payment_no)
    end
  end
end
