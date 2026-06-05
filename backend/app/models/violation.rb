class Violation < ApplicationRecord
  belongs_to :person, optional: true
  belongs_to :vehicle, optional: true
  belongs_to :pass, optional: true
  belongs_to :work_zone, optional: true
  belongs_to :reporter, class_name: 'User', optional: true

  validates :violation_type, presence: true
  validates :violated_at, presence: true

  scope :by_severity, ->(severity) { where(severity: severity) }
  scope :by_status, ->(status) { where(status: status) }
  scope :recent, -> { order(violated_at: :desc) }

  VIOLATION_TYPE_NAMES = {
    'unauthorized_access' => '未授权进入',
    'zone_violation' => '区域违规',
    'time_violation' => '时段违规',
    'no_pass' => '无通行证',
    'expired_pass' => '通行证过期',
    'safety_violation' => '安全违规',
    'other' => '其他'
  }.freeze

  SEVERITY_NAMES = {
    'minor' => '轻微',
    'medium' => '一般',
    'major' => '严重',
    'critical' => '重大'
  }.freeze

  STATUS_NAMES = {
    'reported' => '已上报',
    'processing' => '处理中',
    'handled' => '已处理',
    'closed' => '已结案'
  }.freeze

  def violation_type_name
    VIOLATION_TYPE_NAMES[violation_type] || violation_type
  end

  def severity_name
    SEVERITY_NAMES[severity] || severity
  end

  def status_name
    STATUS_NAMES[status] || status
  end
end
