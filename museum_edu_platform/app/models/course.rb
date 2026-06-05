class Course < ApplicationRecord
  extend FriendlyId
  friendly_id :title, use: :slugged

  has_paper_trail

  enum :status, {
    draft: 0,
    published: 1,
    archived: 2
  }, default: 'draft'

  has_many :sessions, dependent: :destroy
  has_one_attached :cover_image

  validates :title, presence: true, uniqueness: true
  validates :age_min, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 3 }
  validates :age_max, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: :age_min }
  validates :duration_minutes, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :capacity, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :category, presence: true
  validates :cover_image, content_type: ['image/png', 'image/jpeg'],
                          size: { less_than: 10.megabytes }

  scope :published, -> { where(status: :published) }
  scope :by_category, ->(category) { where(category: category) if category.present? }
  scope :for_age, ->(age) { where('age_min <= ? AND age_max >= ?', age, age) if age.present? }

  def age_range
    "#{age_min}-#{age_max}岁"
  end

  def upcoming_sessions
    sessions.upcoming.order(:start_at)
  end
end
