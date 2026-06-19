class LocationRecord < ApplicationRecord
  belongs_to :vehicle

  validates :latitude, presence: true
  validates :longitude, presence: true
  validates :recorded_at, presence: true

  scope :by_vehicle, ->(vehicle_id) { where(vehicle_id: vehicle_id) }
  scope :in_time_range, ->(start_time, end_time) { where(recorded_at: start_time..end_time) }
  scope :order_by_time, -> { order(recorded_at: :desc) }
end
