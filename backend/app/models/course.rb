class Course < ApplicationRecord
  include Audited

  belongs_to :teacher, optional: true
  belongs_to :material_kit, optional: true
  has_many :schedules, dependent: :destroy
  has_many :enrollments, dependent: :destroy
  has_many :works, dependent: :nullify
  has_many :reviews, dependent: :destroy

  validates :title, presence: true
  validates :category, presence: true, inclusion: { in: %w[pottery silver leather] }
  validates :status, presence: true, inclusion: { in: %w[draft published archived] }
  validates :price, numericality: { greater_than_or_equal_to: 0 }
  validates :max_students, numericality: { greater_than: 0 }

  scope :published, -> { where(status: 'published') }
  scope :by_category, ->(category) { where(category: category) if category.present? }
  scope :by_teacher, ->(teacher_id) { where(teacher_id: teacher_id) if teacher_id.present? }

  def average_rating
    reviews.average(:rating)&.round(1) || 0
  end

  def published?
    status == 'published'
  end

  def draft?
    status == 'draft'
  end

  def archived?
    status == 'archived'
  end

  def reviews_count
    reviews.count
  end
end
