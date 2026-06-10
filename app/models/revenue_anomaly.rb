class RevenueAnomaly < ApplicationRecord
  belongs_to :event
  belongs_to :order
  belongs_to :user
  belongs_to :resolved_by, class_name: "User", optional: true

  validates :anomaly_type, presence: true
  validates :amount, numericality: { greater_than_or_equal_to: 0 }
  validates :status, presence: true, inclusion: { in: %w[open resolved] }

  enum :status, { open: "open", resolved: "resolved" }

  scope :by_status, ->(status) { where(status: status) }
  scope :by_event, ->(event_id) { where(event_id: event_id) }
  scope :by_anomaly_type, ->(type) { where(anomaly_type: type) }
  scope :open_anomalies, -> { where(status: "open") }
  scope :recent, -> { order(detected_at: :desc) }
end
