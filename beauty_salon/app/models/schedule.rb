class Schedule < ApplicationRecord
  belongs_to :technician

  validates :work_date, presence: true
  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :work_date, uniqueness: { scope: :technician_id }

  enum :status, { on_duty: 0, off: 1, leave: 2, sick: 3 }

  scope :for_date_range, ->(start_date, end_date) { where(work_date: start_date..end_date) }
end
