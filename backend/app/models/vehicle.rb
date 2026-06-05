class Vehicle < ApplicationRecord
  belongs_to :owner, polymorphic: true, optional: true
  has_many :passes, dependent: :nullify
  has_many :violations, dependent: :nullify
  has_many :gate_logs, dependent: :nullify

  validates :plate_number, presence: true, uniqueness: true

  scope :active, -> { where(blacklisted: false) }
  scope :blacklisted, -> { where(blacklisted: true) }

  VEHICLE_TYPE_NAMES = {
    'car' => '小轿车',
    'truck' => '货车',
    'van' => '面包车',
    'bus' => '客车',
    'engineering' => '工程车',
    'dangerous' => '危化品车',
    'other' => '其他'
  }.freeze

  def vehicle_type_name
    VEHICLE_TYPE_NAMES[vehicle_type] || vehicle_type
  end

  def insurance_expired?
    insurance_expiry.present? && insurance_expiry < Date.current
  end

  def license_expired?
    license_expiry.present? && license_expiry < Date.current
  end

  def add_to_blacklist!(reason = nil)
    update!(blacklisted: true, remark: [remark, reason].compact.join('; '))
  end
end
