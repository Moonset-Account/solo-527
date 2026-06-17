class PriceHistory < ApplicationRecord
  belongs_to :treatment
  belongs_to :changed_by, polymorphic: true, optional: true

  validates :old_price, presence: true
  validates :new_price, presence: true

  scope :recent, -> { order(changed_at: :desc) }
end
