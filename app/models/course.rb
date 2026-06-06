class Course < ApplicationRecord
  include Ransackable
  include AASM

  enum :status, { draft: 0, published: 1, archived: 2 }

  belongs_to :created_by, class_name: 'User', foreign_key: 'created_by_id', optional: true
  has_many :course_sessions, dependent: :destroy
  has_many :feedbacks, through: :course_sessions

  validates :title, presence: true
  validates :age_min, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :age_max, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: :age_min }
  validates :duration_minutes, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :max_participants, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :status, presence: true

  aasm column: :status, enum: true do
    state :draft, initial: true
    state :published
    state :archived

    event :publish do
      transitions from: :draft, to: :published
    end

    event :archive do
      transitions from: [:draft, :published], to: :archived
    end
  end

  scope :published, -> { where(status: :published) }
  scope :for_age, ->(age) { where('age_min <= ? AND age_max >= ?', age, age) }

  def suitable_for_age?(age)
    age >= age_min && age <= age_max
  end
end
