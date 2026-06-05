class CourseSession < ApplicationRecord
  enum status: { draft: 0, scheduled: 1, in_progress: 2, completed: 3, cancelled: 4 }

  belongs_to :course
  belongs_to :teacher
  belongs_to :material_package, optional: true
  has_many :bookings, dependent: :restrict_with_error
  has_many :students, through: :bookings
  has_many :reviews, dependent: :restrict_with_error
  has_many :artworks, dependent: :nullify

  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :location, presence: true, length: { maximum: 200 }
  validates :status, presence: true
  validates :registered_count, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :attended_count, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :end_time_after_start_time

  scope :scheduled, -> { where(status: :scheduled) }
  scope :in_date_range, ->(start_date, end_date) { where(start_time: start_date.beginning_of_day..end_date.end_of_day) }
  scope :by_teacher, ->(teacher_id) { where(teacher_id: teacher_id) }
  scope :upcoming, -> { scheduled.where('start_time > ?', Time.current).order(:start_time) }
  scope :past, -> { where('end_time < ?', Time.current).order(start_time: :desc) }

  def available_slots
    course.max_students - registered_count
  end

  def has_available_slots?
    available_slots > 0
  end

  def material_available?
    return true unless material_package
    material_package.available_quantity > 0
  end

  private

  def end_time_after_start_time
    return if end_time.blank? || start_time.blank?
    errors.add(:end_time, '必须晚于开始时间') if end_time <= start_time
  end
end
