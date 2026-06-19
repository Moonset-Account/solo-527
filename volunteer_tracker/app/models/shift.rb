class Shift < ApplicationRecord
  include AASM

  has_many :shift_enrollments, dependent: :destroy
  has_many :users, through: :shift_enrollments

  validates :title, :start_time, :end_time, :capacity, presence: true

  def self.ransackable_attributes(auth_object = nil)
    %w[title description start_time end_time capacity status created_at updated_at]
  end

  aasm column: :status do
    state :open, initial: true
    state :closed
    state :completed

    event :close do
      transitions from: :open, to: :closed
    end

    event :reopen do
      transitions from: :closed, to: :open
    end

    event :complete do
      transitions from: :closed, to: :completed
    end
  end

  def enrolled_count
    shift_enrollments.where.not(status: 'cancelled').count
  end

  def available_slots
    capacity - enrolled_count
  end

  def full?
    available_slots <= 0
  end

  def can_enroll?
    open? && !full?
  end
end
