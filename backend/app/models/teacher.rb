class Teacher < ApplicationRecord
  enum status: { pending: 0, active: 1, suspended: 2, resigned: 3 }

  belongs_to :user
  has_many :course_sessions, dependent: :restrict_with_error
  has_many :courses, through: :course_sessions
  has_many :reviews, dependent: :nullify
  has_many :teacher_settlements, dependent: :restrict_with_error
  has_many :artworks, dependent: :nullify

  validates :hourly_rate, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :status, presence: true

  scope :active, -> { where(status: :active) }
  scope :by_specialty, ->(specialty) { where('specialties @> ?', "{#{specialty}}") }

  def full_name
    user.name
  end

  def average_rating
    reviews.approved.average(:rating).to_f.round(2)
  end
end
