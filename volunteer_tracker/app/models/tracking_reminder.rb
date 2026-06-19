class TrackingReminder < ApplicationRecord
  include AASM

  belongs_to :trackable, polymorphic: true

  validates :reminder_type, :reminder_date, :message, presence: true

  aasm column: :status do
    state :pending, initial: true
    state :sent
    state :dismissed

    event :mark_sent do
      transitions from: :pending, to: :sent
    end

    event :dismiss do
      transitions from: :pending, to: :dismissed
      transitions from: :sent, to: :dismissed
    end
  end
end
