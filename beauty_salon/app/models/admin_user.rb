class AdminUser < ApplicationRecord
  validates :name, presence: true
  validates :email, presence: true, uniqueness: true

  has_many :notifications, as: :recipient, dependent: :nullify
  has_many :todo_items, as: :assignee, dependent: :nullify
end
