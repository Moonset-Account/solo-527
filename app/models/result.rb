class Result < ApplicationRecord
  has_paper_trail

  belongs_to :event_registration
  belongs_to :schedule, optional: true
  belongs_to :operator, class_name: "User", optional: true

  scope :by_event, ->(event_id) { joins(:event_registration).where(event_registrations: { event_id: event_id }) }
  scope :by_schedule, ->(schedule_id) { where(schedule_id: schedule_id) }
  scope :ranked, -> { order(rank: :asc) }
  scope :by_status, ->(status) { where(status: status) }

  validates :status, inclusion: { in: %w[pending confirmed disqualified] }
  validates :rank, numericality: { greater_than: 0, allow_nil: true }

  def confirm!(operator = nil)
    update!(status: "confirmed", operator: operator)
  end

  def disqualify!(reason = nil, operator = nil)
    update!(status: "disqualified", remark: reason, operator: operator)
  end

  def user_name
    event_registration.user.name
  end

  def event_name
    event_registration.event.name
  end
end
