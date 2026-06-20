class Venue < ApplicationRecord
  has_paper_trail

  has_many :courses, dependent: :nullify
  has_many :events, dependent: :nullify
  has_many :venue_bookings, dependent: :destroy
  has_many :schedules, dependent: :nullify

  scope :active, -> { where(status: "active") }
  scope :by_name, ->(name) { where("name LIKE ?", "%#{name}%") }

  validates :name, presence: true

  def available?(start_time, end_time)
    venue_bookings
      .where(status: "confirmed")
      .where("start_time < ? AND end_time > ?", end_time, start_time)
      .none?
  end

  def overlapping_bookings(start_time, end_time)
    venue_bookings
      .where(status: "confirmed")
      .where("start_time < ? AND end_time > ?", end_time, start_time)
  end
end
