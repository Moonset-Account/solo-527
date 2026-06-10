class SavedFilter < ApplicationRecord
  belongs_to :user

  validates :filterable_type, presence: true
  validates :name, presence: true

  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :by_filterable_type, ->(type) { where(filterable_type: type) }
  scope :recent, -> { order(created_at: :desc) }
end
