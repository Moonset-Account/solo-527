class WorkZone < ApplicationRecord
  has_many :pass_work_zones, dependent: :destroy
  has_many :passes, through: :pass_work_zones
  has_many :violations, dependent: :nullify

  validates :name, presence: true
  validates :code, presence: true, uniqueness: true
  validates :zone_type, presence: true, inclusion: { in: %w[normal dangerous restricted storage office other] }

  scope :active, -> { where(status: 'active') }
  scope :dangerous, -> { where(zone_type: 'dangerous') }
  scope :requires_second_approval, -> { where(requires_second_approval: true) }

  ZONE_TYPE_NAMES = {
    'normal' => '普通区域',
    'dangerous' => '危险区域',
    'restricted' => '管制区域',
    'storage' => '仓储区域',
    'office' => '办公区域',
    'other' => '其他'
  }.freeze

  def zone_type_name
    ZONE_TYPE_NAMES[zone_type] || zone_type
  end

  def dangerous?
    zone_type == 'dangerous'
  end
end
