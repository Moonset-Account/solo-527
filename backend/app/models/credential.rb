class Credential < ApplicationRecord
  belongs_to :person
  belongs_to :verifier, class_name: 'User', optional: true

  validates :credential_type, presence: true
  validates :credential_number, presence: true, uniqueness: { scope: :credential_type }

  scope :verified, -> { where(verified: true) }
  scope :unverified, -> { where(verified: false) }
  scope :expired, -> { where('expiry_date < ?', Date.current) }
  scope :valid, -> { where(verified: true).where('expiry_date >= ? OR expiry_date IS NULL', Date.current) }

  CREDENTIAL_TYPE_NAMES = {
    'id_card' => '身份证',
    'driver_license' => '驾驶证',
    'special_operation' => '特种作业证',
    'safety_certificate' => '安全员证',
    'work_permit' => '工作许可证',
    'other' => '其他'
  }.freeze

  def credential_type_name
    CREDENTIAL_TYPE_NAMES[credential_type] || credential_type
  end

  def expired?
    expiry_date.present? && expiry_date < Date.current
  end

  def currently_valid?
    verified && !expired?
  end

  def verify!(verifier)
    update!(verified: true, verified_at: Time.current, verifier: verifier)
  end
end
