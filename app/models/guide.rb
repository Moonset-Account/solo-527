class Guide < ApplicationRecord
  include Ransackable
  enum :status, { active: 0, on_leave: 1, inactive: 2 }

  has_many :guide_assignments, dependent: :destroy
  has_many :course_sessions, through: :guide_assignments

  validates :name, presence: true
  validates :phone, presence: true, format: { with: /\A1[3-9]\d{9}\z/, message: 'must be a valid phone number' }
  validates :employee_id, uniqueness: true, allow_blank: true
  validates :status, presence: true

  scope :active, -> { where(status: :active) }
  scope :available_for, ->(start_time, end_time) {
    active.where.not(
      id: GuideAssignment.joins(:course_session)
                         .where(course_sessions: { status: [:scheduled, :in_progress] })
                         .where('course_sessions.start_time < ? AND course_sessions.end_time > ?', end_time, start_time)
                         .select(:guide_id)
    )
  }

  def assigned_sessions
    course_sessions.where(status: [:scheduled, :in_progress])
  end

  def has_overlapping_assignment?(new_start, new_end, exclude_session_id = nil)
    scope = assigned_sessions.where('start_time < ? AND end_time > ?', new_end, new_start)
    scope = scope.where.not(id: exclude_session_id) if exclude_session_id
    scope.exists?
  end
end
