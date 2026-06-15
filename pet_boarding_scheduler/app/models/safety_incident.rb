class SafetyIncident < ApplicationRecord
  belongs_to :pet
  belongs_to :caretaker, optional: true
  belongs_to :kennel, optional: true

  validates :incident_type, :occurred_at, :pet_id, presence: true

  enum :severity, { low: 1, medium: 2, high: 3, critical: 4 }

  scope :recent, ->(days = 30) { where("occurred_at >= ?", days.days.ago) }
  scope :unresolved, -> { where(resolved_at: nil) }
  scope :resolved, -> { where.not(resolved_at: nil) }
  scope :by_type, ->(type) { where(incident_type: type) }
  scope :by_severity, ->(severity) { where(severity:) }

  INCIDENT_TYPES = [
    "逃跑",
    "受伤",
    "疾病",
    "打架",
    "误食",
    "设备故障",
    "其他"
  ].freeze

  def resolved?
    resolved_at.present?
  end

  def pet_name
    pet&.name
  end

  def caretaker_name
    caretaker&.name
  end

  def severity_label
    {
      low: "低",
      medium: "中",
      high: "高",
      critical: "严重"
    }.fetch(severity.to_sym, severity)
  end

  def severity_color
    {
      low: "text-green-600 bg-green-50",
      medium: "text-yellow-600 bg-yellow-50",
      high: "text-orange-600 bg-orange-50",
      critical: "text-red-600 bg-red-50"
    }.fetch(severity.to_sym, "text-gray-600 bg-gray-50")
  end
end
