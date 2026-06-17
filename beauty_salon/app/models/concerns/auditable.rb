module Auditable
  extend ActiveSupport::Concern

  included do
    after_create :log_create
    after_update :log_update, if: :meaningful_changes?
    after_destroy :log_destroy

    has_many :audit_logs, as: :auditable, dependent: :nullify
  end

  private

  def log_create
    AuditLog.create!(
      auditable: self,
      action: "create",
      changes_data: attributes.except("id", "created_at", "updated_at"),
      description: "#{self.class.name} 创建"
    )
  end

  def log_update
    AuditLog.create!(
      auditable: self,
      action: "update",
      changes_data: meaningful_changes,
      description: "#{self.class.name} 更新"
    )
  end

  def log_destroy
    AuditLog.create!(
      auditable: self,
      action: "destroy",
      changes_data: attributes.except("id", "created_at", "updated_at"),
      description: "#{self.class.name} 删除"
    )
  end

  def meaningful_changes?
    meaningful_changes.present?
  end

  def meaningful_changes
    changes.except("id", "created_at", "updated_at")
  end
end
