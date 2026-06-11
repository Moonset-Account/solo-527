class TimeSlot < ApplicationRecord
  include AASM

  belongs_to :doctor
  has_many :waiting_lists, dependent: :nullify
  has_many :appointments, dependent: :nullify

  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :capacity, presence: true, numericality: { greater_than: 0 }
  validate :end_time_after_start_time

  scope :on_date, ->(date) { where("DATE(start_time) = ?", date) }
  scope :available, -> { where(status: "available") }
  scope :with_waiting_list, -> { where("waiting_count > 0") }
  scope :upcoming, -> { where("start_time > ?", Time.current) }

  aasm column: "status" do
    state :available, initial: true
    state :full
    state :closed
    state :cancelled

    event :mark_full do
      transitions from: :available, to: :full
    end

    event :reopen do
      transitions from: [:full, :closed], to: :available
    end

    event :close do
      transitions from: [:available, :full], to: :closed
    end

    event :cancel do
      transitions from: [:available, :full, :closed], to: :cancelled
    end
  end

  def available_spots
    capacity - booked_count
  end

  def has_available_spots?
    available_spots > 0
  end

  def waiting_list_entries
    waiting_lists.where(status: "waiting").order(:position)
  end

  def minutes_until_start
    ((start_time - Time.current) / 60).to_i
  end

  private

  def end_time_after_start_time
    return unless start_time && end_time
    if end_time <= start_time
      errors.add(:end_time, "必须晚于开始时间")
    end
  end
end
