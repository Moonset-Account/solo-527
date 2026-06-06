class GuideAssignment < ApplicationRecord
  include Ransackable
  include AASM

  enum :status, { assigned: 0, completed: 1, cancelled: 2 }

  belongs_to :guide
  belongs_to :course_session
  belongs_to :assigned_by, class_name: 'User', foreign_key: 'assigned_by', optional: true

  validates :guide_id, uniqueness: { scope: :course_session_id, message: 'is already assigned to this session' }
  validate :no_overlapping_sessions, on: :create
  validate :guide_is_active

  aasm column: :status, enum: true do
    state :assigned, initial: true
    state :completed
    state :cancelled

    event :complete do
      transitions from: :assigned, to: :completed
    end

    event :cancel do
      transitions from: :assigned, to: :cancelled
    end
  end

  scope :upcoming, -> {
    joins(:course_session).where(course_sessions: { status: :scheduled }).where(status: :assigned)
  }
  scope :in_date_range, ->(start_date, end_date) {
    joins(:course_session).where(course_sessions: { start_time: start_date.beginning_of_day..end_date.end_of_day })
  }

  private

  def no_overlapping_sessions
    return if guide.blank? || course_session.blank?
    if guide.has_overlapping_assignment?(course_session.start_time, course_session.end_time, course_session.id)
      errors.add(:guide, 'has an overlapping session assignment')
    end
  end

  def guide_is_active
    return if guide.blank?
    unless guide.active?
      errors.add(:guide, 'must be active to be assigned')
    end
  end
end
