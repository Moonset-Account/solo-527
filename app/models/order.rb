class Order < ApplicationRecord
  belongs_to :user
  has_many :tickets, dependent: :destroy
  has_many :refunds, dependent: :destroy
  has_many :revenue_anomalies, dependent: :destroy

  validates :order_no, presence: true, uniqueness: true
  validates :total_amount, numericality: { greater_than_or_equal_to: 0 }
  validates :status, presence: true, inclusion: { in: %w[pending paid cancelled refunded] }

  enum :status, { pending: "pending", paid: "paid", cancelled: "cancelled", refunded: "refunded" }

  scope :by_status, ->(status) { where(status: status) }
  scope :paid, -> { where(status: "paid") }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_user, ->(user_id) { where(user_id: user_id) }
end
