class CourseCategory < ApplicationRecord
  has_many :courses, dependent: :restrict_with_error

  validates :name, presence: true, length: { maximum: 50 }
  validates :code, presence: true, uniqueness: true, length: { maximum: 30 }
  validates :sort_order, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :active, -> { where(is_active: true) }
  scope :sorted, -> { order(sort_order: :asc, name: :asc) }
end
