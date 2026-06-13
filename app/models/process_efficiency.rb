class ProcessEfficiency < ApplicationRecord
  belongs_to :process_step
  belongs_to :equipment, optional: true
  belongs_to :team, optional: true
  belongs_to :mold, optional: true

  has_one :work_order, through: :process_step

  validates :standard_output_per_hour, presence: true, numericality: { greater_than: 0 }
  validates :actual_output_per_hour, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :duration_hours, presence: true, numericality: { greater_than: 0 }
  validates :efficiency_rate, presence: true, numericality: { greater_than_or_equal_to: 0 }

  audited

  scope :by_equipment, ->(equipment_id) { where(equipment_id: equipment_id) }
  scope :by_team, ->(team_id) { where(team_id: team_id) }
  scope :by_mold, ->(mold_id) { where(mold_id: mold_id) }
  scope :by_date_range, ->(start_date, end_date) { where(created_at: start_date.beginning_of_day..end_date.end_of_day) }
  scope :low_efficiency, -> { where("efficiency_rate < ?", 80) }
  scope :high_efficiency, -> { where("efficiency_rate >= ?", 100) }
  scope :latest_first, -> { order(created_at: :desc) }

  def efficiency_level
    if efficiency_rate >= 100
      :excellent
    elsif efficiency_rate >= 90
      :good
    elsif efficiency_rate >= 80
      :normal
    elsif efficiency_rate >= 60
      :low
    else
      :poor
    end
  end

  def efficiency_level_name
    I18n.t("enums.process_efficiency.level.#{efficiency_level}", default: efficiency_level.humanize)
  end

  def efficiency_color
    case efficiency_level
    when :excellent then 'text-green-600'
    when :good then 'text-blue-600'
    when :normal then 'text-gray-600'
    when :low then 'text-yellow-600'
    when :poor then 'text-red-600'
    end
  end

  def output_deficit
    [standard_output_per_hour * duration_hours - actual_output_per_hour * duration_hours, 0].max.round(2)
  end
end
