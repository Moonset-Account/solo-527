class Mold < ApplicationRecord
  enum :status, { available: 0, in_use: 1, maintenance: 2, retired: 3 }

  has_many :process_steps
  has_many :process_efficiencies
  has_many :work_orders, through: :process_steps

  validates :code, presence: true, uniqueness: true
  validates :name, presence: true
  validates :max_shots, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :current_shots, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :total_shots, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  audited

  scope :by_status, ->(status) { where(status: status) }
  scope :available_for_use, -> { where(status: [:available, :in_use]) }
  scope :by_material, ->(material) { where(material: material) }
  scope :needing_maintenance, -> { where("current_shots >= max_shots * 0.8") }
  scope :near_end_of_life, -> { where("total_shots >= max_shots * 3") }

  def current_process_step
    process_steps.order(created_at: :desc).find_by(status: [:in_progress, :paused, :quality_check])
  end

  def remaining_shots
    [max_shots - current_shots, 0].max
  end

  def shot_usage_percentage
    return 0 if max_shots.zero?
    ((current_shots.to_f / max_shots) * 100).round(1)
  end

  def total_usage_percentage
    return 0 if max_shots.zero?
    ((total_shots.to_f / (max_shots * 3)) * 100).round(1)
  end

  def maintenance_due?
    current_shots >= max_shots * 0.8
  end

  def near_end_of_life?
    total_shots >= max_shots * 3
  end

  def record_usage(shots)
    increment!(:current_shots, shots)
    increment!(:total_shots, shots)
  end

  def reset_maintenance
    update!(current_shots: 0, maintenance_date: Date.today)
  end

  def average_efficiency(last_days = 30)
    efficiencies = process_efficiencies.where("created_at >= ?", last_days.days.ago)
    return 0 if efficiencies.empty?
    efficiencies.average(:efficiency_rate).round(2)
  end

  def status_name
    I18n.t("enums.mold.status.#{status}", default: status.humanize)
  end

  def status_color
    case status
    when 'available' then 'bg-green-100 text-green-800'
    when 'in_use' then 'bg-blue-100 text-blue-800'
    when 'maintenance' then 'bg-yellow-100 text-yellow-800'
    when 'retired' then 'bg-gray-100 text-gray-800'
    else 'bg-gray-100 text-gray-800'
    end
  end
end
