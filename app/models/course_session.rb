class CourseSession < ApplicationRecord
  include Ransackable
  include AASM

  enum :status, { scheduled: 0, in_progress: 1, completed: 2, cancelled: 3 }

  belongs_to :course
  has_many :bookings, dependent: :destroy
  has_many :guide_assignments, dependent: :destroy
  has_many :guides, through: :guide_assignments
  has_many :teaching_aid_allocations, dependent: :destroy
  has_many :teaching_aids, through: :teaching_aid_allocations
  has_many :feedbacks, dependent: :destroy

  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :max_participants, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :status, presence: true
  validate :end_time_after_start_time

  aasm column: :status, enum: true do
    state :scheduled, initial: true
    state :in_progress
    state :completed
    state :cancelled

    event :start do
      transitions from: :scheduled, to: :in_progress
    end

    event :complete do
      transitions from: :in_progress, to: :completed
    end

    event :cancel do
      transitions from: [:scheduled, :in_progress], to: :cancelled
    end
  end

  scope :upcoming, -> { where('start_time > ?', Time.current).where(status: :scheduled) }
  scope :ongoing, -> { where('start_time <= ? AND end_time >= ?', Time.current, Time.current) }
  scope :past, -> { where('end_time < ?', Time.current) }
  scope :in_date_range, ->(start_date, end_date) { where(start_time: start_date.beginning_of_day..end_date.end_of_day) }

  def total_booked_students
    bookings.where(status: :confirmed).sum(:student_count)
  end

  def available_slots
    max_participants - total_booked_students
  end

  def has_capacity?(count = 1)
    available_slots >= count
  end

  def overlapping_sessions
    CourseSession.where.not(id: id)
                 .where('start_time < ? AND end_time > ?', end_time, start_time)
  end

  private

  def end_time_after_start_time
    return if end_time.blank? || start_time.blank?
    errors.add(:end_time, 'must be after start time') if end_time <= start_time
  end
end
