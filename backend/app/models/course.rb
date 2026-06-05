class Course < ApplicationRecord
  enum difficulty_level: { very_easy: 0, easy: 1, medium: 2, hard: 3, expert: 4 }

  belongs_to :course_category
  has_many :course_sessions, dependent: :restrict_with_error
  has_many :teachers, through: :course_sessions
  has_many :bookings, through: :course_sessions
  has_many :reviews, through: :course_sessions

  validates :title, presence: true, length: { maximum: 100 }
  validates :description, length: { maximum: 500 }
  validates :duration_minutes, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :material_fee, numericality: { greater_than_or_equal_to: 0 }
  validates :difficulty_level, presence: true
  validates :min_students, numericality: { only_integer: true, greater_than: 0 }
  validates :max_students, numericality: { only_integer: true, greater_than_or_equal_to: :min_students }
  validates :bookings_count, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :reviews_count, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :published, -> { where(is_published: true) }
  scope :by_category, ->(category_id) { where(course_category_id: category_id) }
  scope :by_difficulty, ->(level) { where(difficulty_level: level) }
  scope :order_by_rating, -> { order(rating: :desc) }
  scope :order_by_bookings, -> { order(bookings_count: :desc) }

  def average_rating
    reviews.approved.average(:rating).to_f.round(2)
  end

  def available_sessions
    course_sessions.scheduled.where('start_time > ?', Time.current).order(:start_time)
  end
end
