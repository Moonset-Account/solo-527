class Equipment < ApplicationRecord
  enum :status, { available: 0, running: 1, maintenance: 2, down: 3 }

  has_many :process_steps, foreign_key: :assigned_equipment_id
  has_many :process_efficiencies
  has_many :work_orders, through: :process_steps

  validates :code, presence: true, uniqueness: true
  validates :name, presence: true
  validates :standard_output_per_hour, presence: true, numericality: { greater_than: 0 }

  audited

  scope :by_status, ->(status) { where(status: status) }
  scope :available_for_production, -> { where(status: [:available, :running]) }
  scope :by_type, ->(type) { where(equipment_type: type) }
  scope :needing_maintenance, -> { where("last_maintenance_date <= ?", 3.months.ago) }

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

  def total_running_hours(last_days = 30)
    process_efficiencies.where("created_at >= ?", last_days.days.ago).sum(:duration_hours).round(2)
  end

  def status_name
    I18n.t("enums.equipment.status.#{status}", default: status.humanize)
  end

  def status_color
    case status
    when 'available' then 'bg-green-100 text-green-800'
    when 'running' then 'bg-blue-100 text-blue-800'
    when 'maintenance' then 'bg-yellow-100 text-yellow-800'
    when 'down' then 'bg-red-100 text-red-800'
    else 'bg-gray-100 text-gray-800'
    end
  end

  def maintenance_due?
    return false unless last_maintenance_date
    last_maintenance_date <= 3.months.ago
  end
end
