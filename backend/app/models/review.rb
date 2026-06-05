class Review < ApplicationRecord
  enum status: { pending: 0, approved: 1, rejected: 2 }

  belongs_to :student
  belongs_to :course_session
  belongs_to :teacher, optional: true

  validates :rating, presence: true, numericality: { only_integer: true, in: 1..5 }
  validates :content, length: { maximum: 1000 }
  validates :status, presence: true

  scope :approved, -> { where(status: :approved) }
  scope :pending, -> { where(status: :pending) }
  scope :by_course, ->(course_id) { joins(:course_session).where(course_sessions: { course_id: course_id }) }
  scope :by_teacher, ->(teacher_id) { where(teacher_id: teacher_id) }
  scope :order_by_newest, -> { order(created_at: :desc) }

  before_create :set_teacher_from_session

  private

  def set_teacher_from_session
    self.teacher_id ||= course_session.teacher_id
  end
end
