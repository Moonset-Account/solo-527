class Registration < ApplicationRecord
  belongs_to :event
  belongs_to :user
  belongs_to :schedule
  has_one :attendance, dependent: :destroy

  validates :status, presence: true, inclusion: { in: %w[pending approved rejected cancelled] }

  enum :status, { pending: "pending", approved: "approved", rejected: "rejected", cancelled: "cancelled" }

  scope :by_status, ->(status) { where(status: status) }
  scope :by_event, ->(event_id) { where(event_id: event_id) }
  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :by_schedule, ->(schedule_id) { where(schedule_id: schedule_id) }
  scope :recent, -> { order(created_at: :desc) }
  scope :pending_review, -> { where(status: "pending") }
end
