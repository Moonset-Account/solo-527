class Pass < ApplicationRecord
  include AASM

  belongs_to :person
  belongs_to :vehicle, optional: true
  belongs_to :work_zone, optional: true
  belongs_to :creator, class_name: 'User', optional: true
  has_many :pass_work_zones, dependent: :destroy
  has_many :work_zones, through: :pass_work_zones
  has_many :approvals, dependent: :destroy
  has_many :violations, dependent: :nullify
  has_many :gate_logs, dependent: :nullify

  validates :pass_number, presence: true, uniqueness: true
  validates :valid_from, presence: true
  validates :valid_until, presence: true
  validates :pass_type, presence: true

  before_validation :generate_pass_number, on: :create

  scope :active, -> { where(status: 'approved').where('valid_until > ?', Time.current).where(is_frozen: false) }
  scope :pending, -> { where(status: 'pending') }
  scope :expired, -> { where('valid_until <= ?', Time.current) }
  scope :frozen_scope, -> { where(is_frozen: true) }
  scope :by_status, ->(status) { where(status: status) }

  PASS_TYPE_NAMES = {
    'temporary' => '临时通行证',
    'daily' => '日常通行证',
    'long_term' => '长期通行证',
    'special' => '特种作业通行证'
  }.freeze

  STATUS_NAMES = {
    'pending' => '待审批',
    'approved' => '已通过',
    'rejected' => '已拒绝',
    'cancelled' => '已取消'
  }.freeze

  aasm :status, column: :status do
    state :pending, initial: true
    state :approved
    state :rejected
    state :cancelled

    event :approve do
      transitions from: :pending, to: :approved
    end

    event :reject do
      transitions from: :pending, to: :rejected
    end

    event :cancel do
      transitions from: [:pending, :approved], to: :cancelled
    end
  end

  def pass_type_name
    PASS_TYPE_NAMES[pass_type] || pass_type
  end

  def status_name
    STATUS_NAMES[status] || status
  end

  def expired?
    valid_until <= Time.current
  end

  def currently_valid?
    status == 'approved' && !expired? && !is_frozen? && !person.blacklisted?
  end

  def requires_second_approval?
    work_zones.exists?(requires_second_approval: true)
  end

  def first_approval_done?
    approvals.where(approval_level: 1, status: 'approved').exists?
  end

  def second_approval_done?
    approvals.where(approval_level: 2, status: 'approved').exists?
  end

  def fully_approved?
    return first_approval_done? unless requires_second_approval?
    first_approval_done? && second_approval_done?
  end

  def freeze!(reason = nil)
    update!(is_frozen: true, frozen_at: Time.current, freeze_reason: reason)
  end

  def unfreeze!
    update!(is_frozen: false, frozen_at: nil, freeze_reason: nil)
  end

  private

  def generate_pass_number
    return if pass_number.present?
    loop do
      self.pass_number = "PASS#{Time.current.strftime('%Y%m%d')}#{SecureRandom.hex(4).upcase}"
      break unless Pass.exists?(pass_number: pass_number)
    end
  end
end
