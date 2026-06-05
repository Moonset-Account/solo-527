class TeacherSettlement < ApplicationRecord
  enum status: { draft: 0, pending_approval: 1, approved: 2, paid: 3, rejected: 4 }

  belongs_to :teacher
  belongs_to :approved_by, class_name: 'User', optional: true

  validates :settlement_no, presence: true, uniqueness: true
  validates :period_start, presence: true
  validates :period_end, presence: true
  validates :total_sessions, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :total_students, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :base_amount, numericality: { greater_than_or_equal_to: 0 }
  validates :bonus_amount, numericality: { greater_than_or_equal_to: 0 }
  validates :deduction_amount, numericality: { greater_than_or_equal_to: 0 }
  validates :total_amount, numericality: { greater_than_or_equal_to: 0 }
  validates :status, presence: true

  before_validation :generate_settlement_no, on: :create
  before_validation :calculate_total

  scope :by_teacher, ->(teacher_id) { where(teacher_id: teacher_id) }
  scope :pending_approval, -> { where(status: :pending_approval) }
  scope :in_period, ->(start_date, end_date) { where('period_start >= ? AND period_end <= ?', start_date, end_date) }

  def can_approve?
    draft? || pending_approval?
  end

  def can_reject?
    pending_approval?
  end

  def can_mark_paid?
    approved?
  end

  private

  def generate_settlement_no
    return if settlement_no.present?
    loop do
      self.settlement_no = "ST#{Time.current.strftime('%Y%m')}#{SecureRandom.hex(3).upcase}"
      break unless TeacherSettlement.exists?(settlement_no: settlement_no)
    end
  end

  def calculate_total
    self.total_amount = base_amount + bonus_amount - deduction_amount
  end
end
