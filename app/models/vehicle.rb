class Vehicle < ApplicationRecord
  extend Enumerize

  enumerize :status, in: { active: 'active', maintenance: 'maintenance', inactive: 'inactive' }, default: :active
  enumerize :vehicle_type, in: { refrigerated: 'refrigerated', freezer: 'freezer', normal: 'normal' }, default: :normal

  belongs_to :current_driver, class_name: 'User', optional: true

  has_many :temperature_records
  has_many :location_records
  has_many :settlements
  has_many :claims
  has_many :temperature_alerts
  has_many :driver_assignments

  validates :plate_number, presence: true, uniqueness: true

  def current_temperature_status
    latest = latest_temperature
    return 'normal' unless latest

    if min_temperature && max_temperature
      if latest < min_temperature || latest > max_temperature
        'danger'
      elsif latest < min_temperature + 2 || latest > max_temperature - 2
        'warning'
      else
        'normal'
      end
    else
      'normal'
    end
  end

  def latest_temperature
    last_temperature
  end

  def latest_location
    {
      latitude: last_location_lat,
      longitude: last_location_lng,
      recorded_at: last_location_at
    }
  end
end
