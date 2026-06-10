class AuditLog < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :batch_operation, optional: true

  validates :action, presence: true

  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :by_action, ->(action) { where(action: action) }
  scope :by_auditable, ->(type, id) { where(auditable_type: type, auditable_id: id) }
  scope :with_anomaly, -> { where.not(anomaly_type: nil) }
  scope :recent, -> { order(created_at: :desc) }
end
