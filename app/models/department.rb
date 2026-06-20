class Department < ApplicationRecord
  has_many :users, dependent: :nullify
  has_many :tickets, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: true

  scope :ordered, -> { order(name: :asc) }

  def self.ransackable_attributes(auth_object = nil)
    %w[name description created_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[users tickets]
  end
end
