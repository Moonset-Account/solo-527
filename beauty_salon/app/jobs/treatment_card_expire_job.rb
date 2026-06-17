class TreatmentCardExpireJob < ApplicationJob
  queue_as :default

  def perform
    TreatmentCard.active_only.where(expired_at: ..Time.current).find_each do |card|
      card.update!(status: :expired)
      AuditLog.create!(
        auditable: card,
        action: "expire",
        changes_data: { status: ["active", "expired"] },
        description: "疗程卡自动过期"
      )
    end
  end
end
