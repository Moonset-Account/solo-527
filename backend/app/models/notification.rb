class Notification < ApplicationRecord
  belongs_to :recipient, class_name: 'User'
  belongs_to :notifiable, polymorphic: true, optional: true

  validates :title, presence: true
  validates :notification_type, presence: true

  scope :unread, -> { where(read: false) }
  scope :read, -> { where(read: true) }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_type, ->(type) { where(notification_type: type) }

  NOTIFICATION_TYPE_NAMES = {
    'pass_created' => '通行证申请',
    'pass_approved' => '审批通过',
    'pass_rejected' => '审批拒绝',
    'pass_expiring' => '通行证即将过期',
    'pass_expired' => '通行证已过期',
    'violation_reported' => '违规上报',
    'approval_required' => '待审批提醒',
    'system' => '系统通知',
    'import_export' => '导入导出通知'
  }.freeze

  def notification_type_name
    NOTIFICATION_TYPE_NAMES[notification_type] || notification_type
  end

  def mark_as_read!
    update!(read: true, read_at: Time.current)
  end

  def self.mark_all_as_read!(recipient_id)
    where(recipient_id: recipient_id, read: false).update_all(read: true, read_at: Time.current)
  end
end
