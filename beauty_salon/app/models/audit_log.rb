class AuditLog < ApplicationRecord
  belongs_to :auditable, polymorphic: true
  belongs_to :operator, polymorphic: true, optional: true

  validates :action, presence: true

  scope :recent, -> { order(created_at: :desc) }
  scope :by_auditable, ->(type, id) { where(auditable_type: type, auditable_id: id) }
  scope :by_action, ->(a) { where(action: a) if a.present? }
  scope :date_range, ->(start_date, end_date) { where(created_at: start_date..end_date) if start_date.present? && end_date.present? }
end
