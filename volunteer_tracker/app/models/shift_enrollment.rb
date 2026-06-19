class ShiftEnrollment < ApplicationRecord
  include AASM

  belongs_to :user
  belongs_to :shift

  validates :user_id, uniqueness: { scope: :shift_id }

  aasm column: :status do
    state :enrolled, initial: true
    state :checked_in
    state :absent
    state :cancelled

    event :check_in do
      transitions from: :enrolled, to: :checked_in
    end

    event :mark_absent do
      transitions from: :enrolled, to: :absent
    end

    event :cancel do
      transitions from: :enrolled, to: :cancelled
    end
  end
end
