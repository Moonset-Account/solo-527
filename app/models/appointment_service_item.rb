class AppointmentServiceItem < ApplicationRecord
  belongs_to :appointment
  belongs_to :service_item
  has_many :refund_records, dependent: :nullify

  validates :appointment_id, presence: true
  validates :service_item_id, presence: true
  validates :quantity, presence: true, numericality: { greater_than: 0 }
  validates :unit_price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :subtotal, presence: true, numericality: { greater_than_or_equal_to: 0 }

  scope :pending, -> { where(status: "pending") }
  scope :completed, -> { where(status: "completed") }
  scope :refunded, -> { where(status: "refunded") }

  def total_refunded
    refund_records.sum(:refund_amount)
  end

  def remaining_refundable
    subtotal - total_refunded
  end
end
