class Appointment < ApplicationRecord
  belongs_to :customer
  belongs_to :technician
  belongs_to :treatment
  belongs_to :treatment_card_item, optional: true
  has_one :check_in, dependent: :nullify

  validates :scheduled_at, presence: true

  enum :status, { pending: 0, confirmed: 1, in_progress: 2, completed: 3, cancelled: 4, no_show: 5 }

  scope :today, -> { where(scheduled_at: Time.current.beginning_of_day..Time.current.end_of_day) }
  scope :upcoming, -> { where(scheduled_at: Time.current..).where(status: [:pending, :confirmed]).order(scheduled_at: :asc) }
  scope :by_status, ->(s) { where(status: s) if s.present? }
  scope :by_technician, ->(t) { where(technician_id: t) if t.present? }
  scope :date_range, ->(start_date, end_date) { where(scheduled_at: start_date..end_date) if start_date.present? && end_date.present? }
end
