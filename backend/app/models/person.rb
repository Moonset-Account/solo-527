class Person < ApplicationRecord
  has_many :credentials, dependent: :destroy
  has_many :passes, dependent: :destroy
  has_many :violations, dependent: :destroy
  has_many :gate_logs, dependent: :nullify

  validates :name, presence: true
  validates :id_card, presence: true, uniqueness: true
  validates :person_type, presence: true, inclusion: { in: %w[visitor worker contractor supplier other] }

  scope :active, -> { where(blacklisted: false) }
  scope :blacklisted, -> { where(blacklisted: true) }
  scope :by_type, ->(type) { where(person_type: type) }

  PERSON_TYPE_NAMES = {
    'visitor' => '访客',
    'worker' => '工人',
    'contractor' => '承包商',
    'supplier' => '供应商',
    'other' => '其他'
  }.freeze

  def person_type_name
    PERSON_TYPE_NAMES[person_type] || person_type
  end

  def active_passes
    passes.where(status: 'approved').where('valid_until > ?', Time.current).where(is_frozen: false)
  end

  def has_valid_pass_for_zone?(work_zone_id)
    active_passes.joins(:pass_work_zones).exists?(pass_work_zones: { work_zone_id: work_zone_id })
  end

  def violation_count
    violations.count
  end

  def add_to_blacklist!(reason = nil)
    update!(blacklisted: true, remark: [remark, reason].compact.join('; '))
    passes.active.each(&:freeze!)
  end

  def remove_from_blacklist!
    update!(blacklisted: false)
  end
end
