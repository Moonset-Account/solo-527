class Approval < ApplicationRecord
  belongs_to :pass
  belongs_to :approver, class_name: 'User', optional: true

  validates :approval_level, presence: true, inclusion: { in: [1, 2] }
  validates :status, presence: true, inclusion: { in: %w[pending approved rejected] }

  scope :pending, -> { where(status: 'pending') }
  scope :approved, -> { where(status: 'approved') }
  scope :rejected, -> { where(status: 'rejected') }
  scope :by_level, ->(level) { where(approval_level: level) }

  STATUS_NAMES = {
    'pending' => '待审批',
    'approved' => '已通过',
    'rejected' => '已拒绝'
  }.freeze

  def status_name
    STATUS_NAMES[status] || status
  end

  def approve!(approver, comment = nil)
    update!(status: 'approved', approver: approver, approved_at: Time.current, comment: comment)
  end

  def reject!(approver, comment = nil)
    update!(status: 'rejected', approver: approver, rejected_at: Time.current, comment: comment)
  end
end
