class Artwork < ApplicationRecord
  enum status: { draft: 0, pending_review: 1, published: 2, rejected: 3, archived: 4 }

  belongs_to :student
  belongs_to :course_session, optional: true
  belongs_to :teacher, optional: true

  validates :title, presence: true, length: { maximum: 100 }
  validates :description, length: { maximum: 1000 }
  validates :status, presence: true
  validates :likes_count, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :views_count, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :public_artworks, -> { published.where(is_public: true) }
  scope :by_student, ->(student_id) { where(student_id: student_id) }
  scope :by_course, ->(course_id) { joins(:course_session).where(course_sessions: { course_id: course_id }) }
  scope :order_by_likes, -> { order(likes_count: :desc, created_at: :desc) }
  scope :order_by_newest, -> { order(created_at: :desc) }

  def can_publish?
    draft? || rejected?
  end

  def toggle_like!
    increment!(:likes_count)
  end

  def increment_views!
    increment!(:views_count)
  end
end
