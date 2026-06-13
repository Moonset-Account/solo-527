class QualityInspection < ApplicationRecord
  enum :result, { pass: 0, fail: 1, rework: 2 }
  enum :defect_type, {
    dimension_error: 0,
    surface_defect: 1,
    material_defect: 2,
    assembly_error: 3,
    other: 4
  }

  belongs_to :process_step
  belongs_to :inspector, class_name: 'User'

  validates :result, presence: true
  validates :inspection_time, presence: true
  validates :defect_quantity, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :defect_type, presence: true, if: -> { fail? || rework? }

  audited associated_with: :process_step

  scope :by_result, ->(result) { where(result: result) }
  scope :by_inspector, ->(inspector_id) { where(inspector_id: inspector_id) }
  scope :by_date_range, ->(start_date, end_date) { where(inspection_time: start_date.beginning_of_day..end_date.end_of_day) }
  scope :failed, -> { where(result: [:fail, :rework]) }
  scope :passed, -> { where(result: :pass) }
  scope :latest_first, -> { order(inspection_time: :desc) }

  def result_name
    I18n.t("enums.quality_inspection.result.#{result}", default: result.humanize)
  end

  def defect_type_name
    return unless defect_type
    I18n.t("enums.quality_inspection.defect_type.#{defect_type}", default: defect_type.humanize)
  end

  def result_color
    case result
    when 'pass' then 'text-green-600'
    when 'fail' then 'text-red-600'
    when 'rework' then 'text-yellow-600'
    else 'text-gray-600'
    end
  end
end
