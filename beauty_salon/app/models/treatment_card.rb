class TreatmentCard < ApplicationRecord
  belongs_to :customer
  has_many :treatment_card_items, dependent: :destroy
  has_many :treatments, through: :treatment_card_items
  accepts_nested_attributes_for :treatment_card_items, allow_destroy: true, reject_if: :all_blank

  validates :card_number, presence: true, uniqueness: true
  validates :total_amount, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :purchased_at, presence: true

  enum :status, { active: 0, expired: 1, refunded: 2, used_up: 3 }

  scope :active_only, -> { where(status: :active) }
  scope :expiring_soon, -> { where(expired_at: Time.current..7.days.from_now) }
  scope :low_remaining, -> { joins(:treatment_card_items).where("remaining_sessions <= 2 AND remaining_sessions > 0") }

  before_update :track_changes

  def total_remaining_sessions
    treatment_card_items.sum(:remaining_sessions)
  end

  def expired?
    expired_at.present? && expired_at < Time.current
  end

  private

  def track_changes
    AuditLog.create!(
      auditable: self,
      action: "update",
      changes_data: changes.except("updated_at"),
      description: "疗程卡信息变更"
    ) if changes.present? && changes.keys.excluding("updated_at").any?
  end
end
