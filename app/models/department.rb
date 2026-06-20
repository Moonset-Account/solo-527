class Department < ApplicationRecord
  has_many :users, dependent: :nullify
  has_many :tickets, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: true

  scope :ordered, -> { order(name: :asc) }
end
