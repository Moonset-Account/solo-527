class Review < ApplicationRecord
  include Audited

  belongs_to :enrollment
  belongs_to :course
  belongs_to :student, class_name: 'User'
  belongs_to :teacher, optional: true

  validates :rating, presence: true, numericality: { in: 1..5 }
  validates :enrollment_id, uniqueness: true
end
