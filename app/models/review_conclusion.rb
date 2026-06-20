class ReviewConclusion < ApplicationRecord
  has_paper_trail only: [:content, :root_cause, :improvement, :result, :efficiency_before, :efficiency_after]

  belongs_to :ticket
  belongs_to :reviewer, class_name: 'User'

  validates :efficiency_before, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }, allow_nil: true
  validates :efficiency_after, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }, allow_nil: true

  scope :recent, -> { order(created_at: :desc) }
  scope :by_department, ->(dept_id) { joins(:ticket).where(tickets: { department_id: dept_id }) if dept_id.present? }

  def efficiency_delta
    return nil if efficiency_before.nil? || efficiency_after.nil?
    efficiency_after - efficiency_before
  end

  def efficiency_delta_color
    delta = efficiency_delta
    return 'text-gray-500' if delta.nil?
    return 'text-green-600' if delta.positive?
    return 'text-red-600' if delta.negative?
    'text-gray-500'
  end
end
