class BoardingReservation < ApplicationRecord
  belongs_to :pet
  belongs_to :caretaker
  belongs_to :kennel

  has_many :health_records, dependent: :nullify
  has_many :training_records, dependent: :nullify
  has_many :notifications, as: :notifiable, dependent: :destroy

  validates :check_in_at, presence: true
  validates :pet_id, :caretaker_id, :kennel_id, presence: true

  enum :status, { scheduled: 0, checked_in: 1, completed: 2, cancelled: 3 }

  scope :today, -> { where("DATE(check_in_at) = ?", Date.today) }
  scope :current, -> { where(status: :checked_in) }
  scope :upcoming, -> { where(status: :scheduled).order(check_in_at: :asc) }
  scope :by_date_range, ->(start_date, end_date) { where("check_in_at >= ? AND check_in_at <= ?", start_date, end_date) }
  scope :by_caretaker, ->(caretaker_id) { where(caretaker_id:) }

  before_save :calculate_total_price

  def self.ransackable_attributes(auth_object = nil)
    super + %w[id pet_id caretaker_id kennel_id status check_in_at check_out_at total_price notes created_at updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[pet caretaker kennel health_records training_records]
  end

  def duration_days
    return 0 unless check_out_at

    ((check_out_at - check_in_at) / 1.day).ceil
  end

  def calculate_total_price
    return unless kennel && check_in_at && check_out_at

    self.total_price = kennel.daily_rate * duration_days
  end

  def pet_name
    pet&.name
  end

  def caretaker_name
    caretaker&.name
  end

  def kennel_name
    kennel&.name
  end
end
