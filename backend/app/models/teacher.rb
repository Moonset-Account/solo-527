class Teacher < ApplicationRecord
  belongs_to :user
  has_many :courses, dependent: :destroy

  validates :name, presence: true
  validates :status, presence: true, inclusion: { in: %w[active inactive] }

  scope :active, -> { where(status: 'active') }
end
