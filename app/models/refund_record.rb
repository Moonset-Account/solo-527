class RefundRecord < ApplicationRecord
  belongs_to :appointment
  belongs_to :appointment_service_item, optional: true

  validates :refund_no, presence: true, uniqueness: true
  validates :refund_amount, presence: true, numericality: { greater_than: 0 }
  validates :refund_reason, presence: true

  scope :pending, -> { where(status: "pending") }
  scope :processed, -> { where(status: "processed") }
  scope :failed, -> { where(status: "failed") }
  scope :on_date, ->(date) { where("DATE(created_at) = ?", date) }
  scope :for_appointment, ->(appointment_id) { where(appointment_id: appointment_id) }
end
