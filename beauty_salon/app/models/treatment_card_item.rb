class TreatmentCardItem < ApplicationRecord
  belongs_to :treatment_card
  belongs_to :treatment

  validates :total_sessions, presence: true, numericality: { greater_than: 0 }
  validates :remaining_sessions, presence: true, numericality: { greater_than_or_equal_to: 0 }

  before_update :log_session_change

  def consume!
    return false if remaining_sessions <= 0
    update!(remaining_sessions: remaining_sessions - 1)
  end

  def low_remaining?
    remaining_sessions <= 2 && remaining_sessions > 0
  end

  def depleted?
    remaining_sessions.zero?
  end

  private

  def log_session_change
    if remaining_sessions_changed?
      AuditLog.create!(
        auditable: treatment_card,
        action: "session_change",
        changes_data: {
          treatment_id: treatment_id,
          treatment_name: treatment.name,
          from: remaining_sessions_was,
          to: remaining_sessions
        },
        description: "#{treatment.name} 次数从 #{remaining_sessions_was} 变更为 #{remaining_sessions}"
      )
    end
  end
end
