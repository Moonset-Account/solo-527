class ConsumableRule < ApplicationRecord
  belongs_to :treatment

  validates :name, presence: true
  validates :threshold_sessions, presence: true, numericality: { greater_than: 0 }
  validates :threshold_percentage, numericality: { greater_than: 0, less_than_or_equal_to: 100 }, allow_nil: true

  scope :active_only, -> { where(active: true) }

  def matches?(treatment_card_item)
    return true if treatment_card_item.remaining_sessions <= threshold_sessions
    if threshold_percentage.present? && treatment_card_item.total_sessions > 0
      ratio = (treatment_card_item.remaining_sessions.to_f / treatment_card_item.total_sessions) * 100
      return true if ratio <= threshold_percentage
    end
    false
  end
end
