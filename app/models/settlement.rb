class Settlement < ApplicationRecord
  extend Enumerize

  enumerize :status, in: { draft: 'draft', pending: 'pending', approved: 'approved', paid: 'paid', cancelled: 'cancelled' }, default: :draft

  belongs_to :vehicle
  belongs_to :driver, class_name: 'User'
  belongs_to :captain, class_name: 'User', optional: true

  has_many :claims

  validates :settlement_no, presence: true, uniqueness: true
  validates :vehicle_id, presence: true
  validates :driver_id, presence: true
  validates :start_date, presence: true
  validates :end_date, presence: true

  before_validation :generate_settlement_no, on: :create

  def calculate_total
    total = base_fee.to_d + bonus_amount.to_d - deduction_amount.to_d
    self.total_amount = total
    total
  end

  private

  def generate_settlement_no
    return if settlement_no.present?

    date_str = Date.current.strftime('%Y%m%d')
    last_settlement = Settlement.where('settlement_no LIKE ?', "ST#{date_str}%").order(settlement_no: :desc).first
    last_num = last_settlement ? last_settlement.settlement_no[-4..].to_i : 0
    self.settlement_no = "ST#{date_str}#{format('%04d', last_num + 1)}"
  end
end
