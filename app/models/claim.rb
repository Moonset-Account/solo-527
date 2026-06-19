class Claim < ApplicationRecord
  extend Enumerize

  enumerize :status, in: { pending: 'pending', processing: 'processing', approved: 'approved', rejected: 'rejected', paid: 'paid' }, default: :pending
  enumerize :claim_type, in: { temperature: 'temperature', delay: 'delay', damage: 'damage', other: 'other' }

  belongs_to :vehicle
  belongs_to :driver, class_name: 'User'
  belongs_to :settlement, optional: true
  belongs_to :handler, class_name: 'User', optional: true
  belongs_to :reporter, class_name: 'User', foreign_key: 'reported_by_id', optional: true

  validates :claim_no, presence: true, uniqueness: true
  validates :vehicle_id, presence: true
  validates :driver_id, presence: true
  validates :claim_type, presence: true
  validates :amount, presence: true

  before_validation :generate_claim_no, on: :create

  def handle_duration
    return nil unless reported_at && handled_at

    (handled_at - reported_at).to_i
  end

  private

  def generate_claim_no
    return if claim_no.present?

    date_str = Date.current.strftime('%Y%m%d')
    last_claim = Claim.where('claim_no LIKE ?', "CL#{date_str}%").order(claim_no: :desc).first
    last_num = last_claim ? last_claim.claim_no[-4..].to_i : 0
    self.claim_no = "CL#{date_str}#{format('%04d', last_num + 1)}"
  end
end
