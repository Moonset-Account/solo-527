class Inventory < ApplicationRecord
  belongs_to :ticket_type

  validates :total, numericality: { greater_than_or_equal_to: 0 }
  validates :sold, numericality: { greater_than_or_equal_to: 0 }
  validates :reserved, numericality: { greater_than_or_equal_to: 0 }
  validates :available, numericality: { greater_than_or_equal_to: 0 }

  scope :low_stock, -> { where("available <= ?", 10) }
  scope :by_event, ->(event_id) { joins(:ticket_type).where(ticket_types: { event_id: event_id }) }
end
