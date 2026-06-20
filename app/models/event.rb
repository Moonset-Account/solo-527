class Event < ApplicationRecord
  has_paper_trail

  belongs_to :venue, optional: true
  has_many :event_registrations, dependent: :destroy
  has_many :users, through: :event_registrations
  has_many :schedules, dependent: :destroy
  has_many :results, through: :event_registrations

  scope :by_status, ->(status) { where(status: status) }
  scope :upcoming, -> { where("start_date >= ?", Date.today) }
  scope :registration_open, -> { where("registration_start <= ? AND registration_end >= ?", Time.current, Time.current) }
  scope :recent, -> { order(start_date: :desc) }

  validates :name, presence: true
  validates :status, inclusion: { in: %w[draft open closed in_progress completed cancelled] }

  def registration_open?
    return false unless registration_start && registration_end
    Time.current.between?(registration_start, registration_end)
  end

  def full?
    return false unless max_participants
    event_registrations.confirmed.count >= max_participants
  end

  def available_spots
    return nil unless max_participants
    [max_participants - event_registrations.confirmed.count, 0].max
  end

  def register_user(user, params = {})
    return false unless registration_open? && !full?

    event_registrations.create!(
      user: user,
      registration_fee: registration_fee,
      status: "pending",
      payment_status: "unpaid",
      category: params[:category],
      team_name: params[:team_name],
      source: params[:source] || "web"
    )
  end
end
