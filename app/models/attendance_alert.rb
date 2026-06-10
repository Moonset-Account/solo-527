class AttendanceAlert < ApplicationRecord
  belongs_to :event
  belongs_to :schedule

  validates :expected_count, numericality: { greater_than_or_equal_to: 0 }
  validates :actual_count, numericality: { greater_than_or_equal_to: 0 }
  validates :gap_count, numericality: { greater_than_or_equal_to: 0 }
  validates :status, presence: true, inclusion: { in: %w[open closed] }

  enum :status, { open: "open", closed: "closed" }

  scope :by_event, ->(event_id) { where(event_id: event_id) }
  scope :by_status, ->(status) { where(status: status) }
  scope :open_alerts, -> { where(status: "open") }
  scope :recent, -> { order(created_at: :desc) }
end
