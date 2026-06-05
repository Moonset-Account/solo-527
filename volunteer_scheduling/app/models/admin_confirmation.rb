class AdminConfirmation < ApplicationRecord
  belongs_to :confirmable, polymorphic: true
  belongs_to :admin, class_name: "User"

  validates :confirmed_at, presence: true
end
