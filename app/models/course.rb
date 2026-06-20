class Course < ApplicationRecord
  has_paper_trail

  belongs_to :venue, optional: true
  has_many :course_enrollments, dependent: :destroy
  has_many :users, through: :course_enrollments
  has_many :leave_requests, through: :course_enrollments

  scope :active, -> { where(status: "active") }
  scope :by_level, ->(level) { where(level: level) }
  scope :upcoming, -> { where("start_date >= ?", Date.today) }
  scope :with_available_spots, -> { where("enrolled_count < capacity") }

  validates :name, presence: true
  validates :capacity, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :enrolled_count, numericality: { greater_than_or_equal_to: 0 }
  validates :status, inclusion: { in: %w[draft active full completed cancelled] }

  def fill_rate
    return 0.0 if capacity.zero?
    (enrolled_count.to_f / capacity * 100).round(2)
  end

  def has_available_spots?
    enrolled_count < capacity
  end

  def full?
    enrolled_count >= capacity
  end

  def enroll_user(user, source: "web")
    return false unless has_available_spots?

    transaction do
      enrollment = course_enrollments.create!(
        user: user,
        price: price,
        status: "confirmed",
        payment_status: "unpaid",
        source: source
      )
      increment!(:enrolled_count)
      enrollment
    end
  end
end
