class Availability < ApplicationRecord
  belongs_to :volunteer_profile

  validates :day_of_week, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 6 }
  validates :start_time, presence: true
  validates :end_time, presence: true
  validate :end_time_after_start_time

  DAYS = %w[周日 周一 周二 周三 周四 周五 周六].freeze

  def end_time_after_start_time
    return unless start_time && end_time
    if end_time <= start_time
      errors.add(:end_time, "必须晚于开始时间")
    end
  end

  def day_name
    DAYS[day_of_week]
  end
end
