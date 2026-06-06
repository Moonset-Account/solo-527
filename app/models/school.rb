class School < ApplicationRecord
  include Ransackable
  enum :status, { active: 0, inactive: 1 }

  has_many :students, dependent: :nullify
  has_many :bookings, dependent: :nullify

  validates :name, presence: true, uniqueness: true
  validates :status, presence: true

  scope :active, -> { where(status: :active) }
  scope :search_by_name, ->(keyword) { where('name LIKE ?', "%#{keyword}%") }
end
