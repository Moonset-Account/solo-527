class Doctor < ApplicationRecord
  has_many :time_slots, dependent: :destroy
  has_many :waiting_lists, dependent: :nullify
  has_many :appointments, dependent: :nullify

  scope :active, -> { where(active: true) }
  scope :by_department, ->(dept) { where(department: dept) if dept.present? }

  validates :name, presence: true

  def available_time_slots(date = Date.today)
    time_slots.where("DATE(start_time) = ?", date)
              .where(status: "available")
              .where("booked_count < capacity")
              .order(:start_time)
  end

  def daily_appointments_count(date = Date.today)
    appointments.where("DATE(appointment_date) = ?", date)
                .where.not(status: ["cancelled", "no_show"])
                .count
  end

  def daily_load_ratio(date = Date.today)
    return 0 if daily_max_patients.to_i == 0
    (daily_appointments_count(date).to_f / daily_max_patients * 100).round(1)
  end
end
