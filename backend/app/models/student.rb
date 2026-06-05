class Student < ApplicationRecord
  enum level: { beginner: 0, intermediate: 1, advanced: 2, expert: 3 }

  belongs_to :user
  has_many :bookings, dependent: :restrict_with_error
  has_many :course_sessions, through: :bookings
  has_many :artworks, dependent: :restrict_with_error
  has_many :reviews, dependent: :restrict_with_error
  has_many :payments, dependent: :restrict_with_error

  validates :level, presence: true
  validates :total_courses, numericality: { greater_than_or_equal_to: 0 }
  validates :total_spent, numericality: { greater_than_or_equal_to: 0 }

  def full_name
    user.name
  end

  def active_bookings
    bookings.where(status: [:pending, :approved, :paid])
  end

  def completed_courses_count
    bookings.where(status: :completed).count
  end
end
