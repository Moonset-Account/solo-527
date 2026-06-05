class Booking < ApplicationRecord
  enum status: {
    pending: 0,
    approved: 1,
    paid: 2,
    completed: 3,
    cancelled: 4,
    rejected: 5
  }

  enum payment_status: {
    unpaid: 0,
    pending_payment: 1,
    paid: 2,
    refunded: 3,
    partially_refunded: 4
  }

  enum attendance_status: {
    not_checked_in: 0,
    checked_in: 1,
    absent: 2,
    late: 3
  }

  belongs_to :student
  belongs_to :course_session
  belongs_to :material_package, optional: true
  belongs_to :approved_by, class_name: 'User', optional: true
  has_many :payments, dependent: :restrict_with_error

  validates :booking_no, presence: true, uniqueness: true
  validates :course_fee, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :material_fee, numericality: { greater_than_or_equal_to: 0 }
  validates :total_amount, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :paid_amount, numericality: { greater_than_or_equal_to: 0 }
  validates :status, presence: true
  validates :payment_status, presence: true
  validates :attendance_status, presence: true

  before_validation :generate_booking_no, on: :create
  before_validation :calculate_total_amount

  scope :by_student, ->(student_id) { where(student_id: student_id) }
  scope :by_course_session, ->(course_session_id) { where(course_session_id: course_session_id) }
  scope :by_status, ->(status) { where(status: status) }
  scope :pending_approval, -> { where(status: :pending) }
  scope :upcoming, -> { joins(:course_session).where('course_sessions.start_time > ?', Time.current).order('course_sessions.start_time ASC') }

  def can_cancel?
    %w[pending approved paid].include?(status) && course_session.start_time > 24.hours.from_now
  end

  def can_pay?
    %w[pending approved].include?(status) && unpaid?
  end

  def needs_approval?
    course_session.course.requires_approval
  end

  def outstanding_amount
    total_amount - paid_amount
  end

  def fully_paid?
    paid_amount >= total_amount
  end

  private

  def generate_booking_no
    return if booking_no.present?
    loop do
      self.booking_no = "BK#{Time.current.strftime('%Y%m%d')}#{SecureRandom.hex(4).upcase}"
      break unless Booking.exists?(booking_no: booking_no)
    end
  end

  def calculate_total_amount
    self.total_amount = course_fee + material_fee
  end
end
