class AuditLogService
  def log(action:, auditable:, user: nil, change_details: {}, anomaly_type: nil, batch_operation: nil)
    AuditLog.create!(
      user: user,
      action: action,
      auditable_type: auditable.class.name,
      auditable_id: auditable.id,
      change_details: change_details,
      anomaly_type: anomaly_type,
      batch_operation_id: batch_operation&.id
    )
  end

  def for_user(user, limit: 50)
    AuditLog.where(user: user).order(created_at: :desc).limit(limit)
  end

  def for_auditable(auditable)
    AuditLog.where(auditable_type: auditable.class.name, auditable_id: auditable.id).order(created_at: :desc)
  end

  def anomalies
    AuditLog.where.not(anomaly_type: nil).order(created_at: :desc)
  end
end
