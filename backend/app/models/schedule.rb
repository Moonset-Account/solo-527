class Schedule < ApplicationRecord
  belongs_to :course
  has_many :enrollments, dependent: :destroy

  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :max_students, numericality: { greater_than: 0 }

  validate :end_time_after_start_time

  scope :upcoming, -> { where('start_time > ?', Time.current) }
  scope :past, -> { where('end_time < ?', Time.current) }

  def end_time_after_start_time
    return if end_time.blank? || start_time.blank?

    errors.add(:end_time, 'must be after start time') if end_time <= start_time
  end

  def enrolled_count
    enrollments.where.not(status: %w[cancelled refunded]).count
  end

  def available_slots
    max_students - enrolled_count
  end

  def fully_booked?
    available_slots <= 0
  end
end
