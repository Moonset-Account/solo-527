class Booking < ApplicationRecord
  include Ransackable
  include AASM

  enum :booking_type, { school_group: 0, individual: 1 }
  enum :status, { pending: 0, confirmed: 1, cancelled: 2, rejected: 3 }

  belongs_to :course_session
  belongs_to :school, optional: true
  belongs_to :created_by, class_name: 'User', foreign_key: 'created_by', optional: true
  belongs_to :cancelled_by, class_name: 'User', foreign_key: 'cancelled_by', optional: true
  has_many :booking_students, dependent: :destroy
  has_many :students, through: :booking_students
  has_many :feedbacks, dependent: :nullify

  validates :course_session, presence: true
  validates :booking_type, presence: true
  validates :student_count, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :status, presence: true
  validates :contact_name, presence: true
  validates :contact_phone, presence: true, format: { with: /\A1[3-9]\d{9}\z/, message: 'must be a valid phone number' }
  validate :school_presence_for_group_booking
  validate :sufficient_capacity, on: :create

  aasm column: :status, enum: true do
    state :pending, initial: true
    state :confirmed
    state :cancelled
    state :rejected

    event :confirm do
      transitions from: :pending, to: :confirmed, after: :after_confirm
    end

    event :cancel do
      transitions from: [:pending, :confirmed], to: :cancelled, after: :after_cancel
    end

    event :reject do
      transitions from: :pending, to: :rejected
    end
  end

  scope :by_status, ->(status) { where(status: status) }
  scope :by_booking_type, ->(type) { where(booking_type: type) }
  scope :in_date_range, ->(start_date, end_date) {
    joins(:course_session).where(course_sessions: { start_time: start_date.beginning_of_day..end_date.end_of_day })
  }
  scope :by_school, ->(school_id) { where(school_id: school_id) }

  def add_student(student)
    booking_students.find_or_create_by(student: student)
  end

  def remove_student(student)
    booking_students.find_by(student: student)&.destroy
  end

  def checked_in_count
    booking_students.where(attended: true).count
  end

  private

  def school_presence_for_group_booking
    if school_group? && school.blank?
      errors.add(:school, '团体报名必须指定学校')
    end
  end

  def sufficient_capacity
    return if course_session.blank?
    unless course_session.has_capacity?(student_count)
      errors.add(:student_count, "超过可用名额（剩余 #{course_session.available_slots} 个）")
    end
  end

  def after_confirm
    BookingConfirmationJob.perform_later(id) if defined?(BookingConfirmationJob)
  end

  def after_cancel
    self.cancelled_at = Time.current
    BookingCancellationJob.perform_later(id) if defined?(BookingCancellationJob)
  end
end
