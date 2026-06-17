class AdminUser < ApplicationRecord
  validates :name, presence: true
  validates :email, presence: true, uniqueness: true

  has_many :notifications, as: :recipient, dependent: :nullify
  has_many :todo_items, as: :assignee, dependent: :nullify

  def self.default
    find_or_create_by!(email: "admin@beauty.com") do |admin|
      admin.name = "店长"
    end
  end
end
