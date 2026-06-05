class Credential < ApplicationRecord
  belongs_to :person
  belongs_to :verifier, class_name: 'User', optional: true

  attr_accessor :number, :issued_by, :issued_at, :valid_until

  validates :credential_type, presence: true
  validates :credential_number, presence: true, uniqueness: { scope: :credential_type }

  before_validation :map_alias_fields

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

  CREDENTIAL_TYPE_ALIASES = {
    'operation_cert' => 'special_operation',
    'safety_officer' => 'safety_certificate',
    'safety_cert' => 'safety_certificate'
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

  private

  def map_alias_fields
    self.credential_number ||= number if number.present?
    self.issuing_authority ||= issued_by if issued_by.present?
    self.issue_date ||= issued_at if issued_at.present?
    self.expiry_date ||= valid_until if valid_until.present?
    self.credential_type = CREDENTIAL_TYPE_ALIASES[credential_type] || credential_type if credential_type.present?
  end
end
