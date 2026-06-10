class TicketType < ApplicationRecord
  belongs_to :event
  has_one :inventory, dependent: :destroy
  has_many :tickets, dependent: :destroy
  has_many :orders, through: :tickets

  validates :name, presence: true
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :purchase_limit, numericality: { greater_than: 0 }
  validates :status, presence: true, inclusion: { in: %w[active inactive sold_out] }

  enum :status, { active: "active", inactive: "inactive", sold_out: "sold_out" }

  scope :by_event, ->(event_id) { where(event_id: event_id) }
  scope :active, -> { where(status: "active") }
  scope :recent, -> { order(created_at: :desc) }
end
