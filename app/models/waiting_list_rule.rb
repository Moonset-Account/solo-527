class WaitingListRule < ApplicationRecord
  has_many :waiting_lists, dependent: :nullify

  validates :name, presence: true
  validates :release_minutes_before, presence: true, numericality: { greater_than: 0 }
  validates :max_waiting_per_slot, presence: true, numericality: { greater_than: 0 }
  validates :confirmation_timeout_minutes, presence: true, numericality: { greater_than: 0 }

  scope :active, -> { where(active: true) }
  scope :currently_effective, -> {
    active.where("(effective_from IS NULL OR effective_from <= ?) AND (effective_to IS NULL OR effective_to >= ?)",
                 Time.current, Time.current)
  }
  scope :ordered_by_priority, -> { order(priority: :asc, id: :asc) }

  def self.default_rule
    currently_effective.ordered_by_priority.first
  end

  def applies_to_time_slot?(time_slot)
    return false unless active
    return true if effective_from.blank? && effective_to.blank?
    return false if effective_from.present? && time_slot.start_time < effective_from
    return false if effective_to.present? && time_slot.start_time > effective_to
    true
  end

  def release_time_for(time_slot)
    time_slot.start_time - release_minutes_before.minutes
  end

  def confirmation_deadline_for(time_slot)
    time_slot.start_time - confirmation_timeout_minutes.minutes
  end
end
