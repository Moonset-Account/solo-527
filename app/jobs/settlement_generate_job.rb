class SettlementGenerateJob < ApplicationJob
  queue_as :settlements

  def perform(settlement_id)
    settlement = Settlement.find_by(id: settlement_id)
    return unless settlement

    vehicle = settlement.vehicle
    return unless vehicle

    start_date = settlement.start_date.beginning_of_day
    end_date = settlement.end_date.end_of_day

    distance = calculate_distance(vehicle, start_date, end_date)
    duration = calculate_duration(vehicle, start_date, end_date)

    base_fee = calculate_base_fee(distance, duration)

    settlement.update(
      distance: distance,
      duration_hours: duration,
      base_fee: base_fee
    )

    settlement.calculate_total
    settlement.save!
  end

  private

  def calculate_distance(vehicle, start_date, end_date)
    location_records = vehicle.location_records.where(recorded_at: start_date..end_date)
    return 0.0 if location_records.empty?

    total_distance = 0.0
    prev_record = nil

    location_records.order(recorded_at: :asc).each do |record|
      if prev_record
        total_distance += haversine_distance(
          prev_record.latitude, prev_record.longitude,
          record.latitude, record.longitude
        )
      end
      prev_record = record
    end

    total_distance.round(2)
  end

  def calculate_duration(vehicle, start_date, end_date)
    location_records = vehicle.location_records.where(recorded_at: start_date..end_date)
    return 0.0 if location_records.empty?

    first_record = location_records.order(recorded_at: :asc).first
    last_record = location_records.order(recorded_at: :desc).first

    ((last_record.recorded_at - first_record.recorded_at) / 3600).round(2)
  end

  def calculate_base_fee(distance, duration)
    rate_per_km = 2.0
    rate_per_hour = 10.0

    (distance * rate_per_km + duration * rate_per_hour).round(2)
  end

  def haversine_distance(lat1, lng1, lat2, lng2)
    earth_radius = 6371.0

    dlat = (lat2 - lat1) * Math::PI / 180.0
    dlng = (lng2 - lng1) * Math::PI / 180.0

    a = Math.sin(dlat / 2.0)**2 +
        Math.cos(lat1 * Math::PI / 180.0) *
        Math.cos(lat2 * Math::PI / 180.0) *
        Math.sin(dlng / 2.0)**2

    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    earth_radius * c
  end
end
