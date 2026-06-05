class User < ApplicationRecord
  has_secure_password

  has_many :created_passes, class_name: 'Pass', foreign_key: 'creator_id'
  has_many :approvals, foreign_key: 'approver_id'
  has_many :verified_credentials, class_name: 'Credential', foreign_key: 'verifier_id'
  has_many :reported_violations, class_name: 'Violation', foreign_key: 'reporter_id'
  has_many :gate_logs, foreign_key: 'operator_id'
  has_many :notifications, foreign_key: 'recipient_id'
  has_many :import_export_jobs, foreign_key: 'creator_id'

  validates :username, presence: true, uniqueness: true
  validates :role, presence: true, inclusion: { in: %w[admin safety_officer approver guard staff] }

  scope :active, -> { where(active: true) }
  scope :by_role, ->(role) { where(role: role) }

  ROLE_NAMES = {
    'admin' => '系统管理员',
    'safety_officer' => '安全员',
    'approver' => '审批人',
    'guard' => '门岗',
    'staff' => '普通员工'
  }.freeze

  def role_name
    ROLE_NAMES[role] || role
  end

  def can_approve?
    %w[admin approver safety_officer].include?(role)
  end

  def can_manage?
    %w[admin safety_officer].include?(role)
  end

  def can_verify_credentials?
    %w[admin safety_officer].include?(role)
  end
end
