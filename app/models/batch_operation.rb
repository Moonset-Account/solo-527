class BatchOperation < ApplicationRecord
  belongs_to :user
  has_many :audit_logs, dependent: :nullify

  validates :operation_type, presence: true
  validates :target_type, presence: true
  validates :status, presence: true, inclusion: { in: %w[pending running completed failed] }

  enum :status, { pending: "pending", running: "running", completed: "completed", failed: "failed" }

  scope :by_status, ->(status) { where(status: status) }
  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :by_operation_type, ->(type) { where(operation_type: type) }
  scope :recent, -> { order(created_at: :desc) }
end
