class Technician < ApplicationRecord
  has_many :schedules, dependent: :destroy
  has_many :appointments, dependent: :nullify
  has_many :check_ins, dependent: :nullify

  validates :name, presence: true
  validates :phone, presence: true

  scope :active_only, -> { where(active: true) }

  def available_on?(date, start_time, end_time)
    schedule = schedules.find_by(work_date: date)
    return false unless schedule
    return false if schedule.off?

    conflicting = appointments.where(scheduled_at: date.to_datetime.change(hour: start_time.hour, min: start_time.min)..date.to_datetime.change(hour: end_time.hour, min: end_time.min))
                              .where.not(status: :cancelled)
    conflicting.none?
  end
end
