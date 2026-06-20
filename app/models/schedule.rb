class Schedule < ApplicationRecord
  has_paper_trail

  belongs_to :event
  belongs_to :venue, optional: true
  has_many :results, dependent: :destroy
  has_many :check_ins, as: :checkinable, dependent: :destroy

  scope :by_event, ->(event_id) { where(event_id: event_id) }
  scope :by_status, ->(status) { where(status: status) }
  scope :upcoming, -> { where("start_time >= ?", Time.current) }
  scope :by_date, ->(date) { where("DATE(start_time) = ?", date) }
  scope :ordered, -> { order(start_time: :asc) }

  validates :title, presence: true
  validates :start_time, presence: true
  validates :status, inclusion: { in: %w[scheduled in_progress completed cancelled] }

  def start!
    update!(status: "in_progress")
  end

  def complete!
    update!(status: "completed")
  end

  def cancel!
    update!(status: "cancelled")
  end

  def status_text
    I18n.t("schedule.status.#{status}", default: status)
  end
end
