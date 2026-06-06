class Feedback < ApplicationRecord
  include Ransackable
  belongs_to :course_session
  belongs_to :booking, optional: true
  belongs_to :author, class_name: 'User', foreign_key: 'author_id', optional: true

  validates :course_session, presence: true
  validates :rating, numericality: { only_integer: true, in: 1..5 }, allow_nil: true
  validates :content, presence: true, length: { maximum: 2000 }

  scope :by_rating, ->(rating) { where(rating: rating) }
  scope :by_course_session, ->(session_id) { where(course_session_id: session_id) }
  scope :recent, -> { order(created_at: :desc) }

  def average_rating
    course_session.feedbacks.average(:rating)
  end
end
