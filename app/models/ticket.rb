class Ticket < ApplicationRecord
  belongs_to :order
  belongs_to :ticket_type

  validates :ticket_no, presence: true, uniqueness: true
  validates :status, presence: true, inclusion: { in: %w[active used cancelled refunded] }

  enum :status, { active: "active", used: "used", cancelled: "cancelled", refunded: "refunded" }

  scope :by_status, ->(status) { where(status: status) }
  scope :by_order, ->(order_id) { where(order_id: order_id) }
  scope :by_ticket_type, ->(ticket_type_id) { where(ticket_type_id: ticket_type_id) }
  scope :valid_tickets, -> { where(status: "active") }
  scope :recent, -> { order(created_at: :desc) }
end
