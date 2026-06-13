class Team < ApplicationRecord
  enum :shift, { morning: 0, afternoon: 1, night: 2 }

  has_many :process_steps, foreign_key: :assigned_team_id
  has_many :process_efficiencies
  has_many :work_orders, through: :process_steps

  validates :code, presence: true, uniqueness: true
  validates :name, presence: true
  validates :shift, presence: true
  validates :leader_name, presence: true
  validates :member_count, presence: true, numericality: { only_integer: true, greater_than: 0 }

  audited

  scope :by_shift, ->(shift) { where(shift: shift) }
  scope :active, -> { where(active: true) } if column_names.include?('active')
  scope :by_shift_time, ->(time = Time.current) do
    hour = time.hour
    if hour >= 6 && hour < 14
      where(shift: :morning)
    elsif hour >= 14 && hour < 22
      where(shift: :afternoon)
    else
      where(shift: :night)
    end
  end

  def current_process_step
    process_steps.order(created_at: :desc).find_by(status: [:in_progress, :paused, :quality_check])
  end

  def current_work_order
    current_process_step&.work_order
  end

  def average_efficiency(last_days = 30)
    efficiencies = process_efficiencies.where("created_at >= ?", last_days.days.ago)
    return 0 if efficiencies.empty?
    efficiencies.average(:efficiency_rate).round(2)
  end

  def total_completed_steps(last_days = 30)
    process_steps.completed.where("completed_at >= ?", last_days.days.ago).count
  end

  def shift_name
    I18n.t("enums.team.shift.#{shift}", default: shift.humanize)
  end

  def shift_hours
    case shift
    when 'morning' then '06:00 - 14:00'
    when 'afternoon' then '14:00 - 22:00'
    when 'night' then '22:00 - 06:00'
    end
  end
end
