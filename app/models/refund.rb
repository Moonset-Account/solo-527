class Refund < ApplicationRecord
  belongs_to :order
  belongs_to :user
  belongs_to :reviewed_by, class_name: "User", optional: true

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :status, presence: true, inclusion: { in: %w[pending approved rejected] }

  enum :status, { pending: "pending", approved: "approved", rejected: "rejected" }

  scope :by_status, ->(status) { where(status: status) }
  scope :by_order, ->(order_id) { where(order_id: order_id) }
  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :recent, -> { order(created_at: :desc) }
  scope :pending_review, -> { where(status: "pending") }
end
