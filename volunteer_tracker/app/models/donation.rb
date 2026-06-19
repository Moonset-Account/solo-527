class Donation < ApplicationRecord
  include AASM

  belongs_to :material, optional: true

  validates :donor_name, :donation_type, presence: true
  validates :donation_type, inclusion: { in: %w[money material] }

  def self.ransackable_attributes(auth_object = nil)
    %w[donor_name donor_contact amount donation_type material_id quantity status remark created_at updated_at]
  end

  aasm column: :status do
    state :pending, initial: true
    state :received
    state :confirmed
    state :rejected

    event :receive do
      transitions from: :pending, to: :received
    end

    event :confirm do
      transitions from: :received, to: :confirmed
    end

    event :reject do
      transitions from: :pending, to: :rejected
      transitions from: :received, to: :rejected
    end
  end

  def material_donation?
    donation_type == 'material'
  end
end
