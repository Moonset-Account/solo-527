class TemperatureAlert < ApplicationRecord
  extend Enumerize

  enumerize :alert_type, in: { over_high: 'over_high', over_low: 'over_low' }
  enumerize :status, in: { active: 'active', resolved: 'resolved' }, default: :active

  belongs_to :vehicle
  belongs_to :resolved_by, class_name: 'User', optional: true

  validates :vehicle_id, presence: true
  validates :alert_type, presence: true
  validates :temperature, presence: true
  validates :threshold, presence: true
  validates :start_time, presence: true

  def duration_seconds
    end_time = self.end_time || Time.current
    (end_time - start_time).to_i
  end

  def resolve!(user, note = nil)
    self.status = :resolved
    self.resolved_by = user
    self.resolved_at = Time.current
    self.end_time = Time.current
    self.resolution_note = note
    self.duration_seconds = duration_seconds
    save!
  end
end
