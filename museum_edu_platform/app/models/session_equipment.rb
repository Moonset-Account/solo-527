class SessionEquipment < ApplicationRecord
  has_paper_trail

  enum :status, {
    allocated: 0,
    returned: 1,
    lost: 2
  }, default: 'allocated'

  belongs_to :session
  belongs_to :equipment

  validates :session, presence: true
  validates :equipment, presence: true
  validates :quantity_allocated, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validate :equipment_availability, on: :create

  scope :by_session, ->(session_id) { where(session_id: session_id) if session_id.present? }
  scope :by_equipment, ->(equipment_id) { where(equipment_id: equipment_id) if equipment_id.present? }

  private

  def equipment_availability
    return if equipment.blank?
    return if quantity_allocated.blank?

    if equipment.available_quantity < quantity_allocated
      errors.add(:quantity_allocated, "超过可用数量（剩余 #{equipment.available_quantity} 个）")
    end
  end
end
