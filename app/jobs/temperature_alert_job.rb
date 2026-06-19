class TemperatureAlertJob < ApplicationJob
  queue_as :alerts

  def perform(temperature_record_id)
    temperature_record = TemperatureRecord.find_by(id: temperature_record_id)
    return unless temperature_record

    vehicle = temperature_record.vehicle
    return unless vehicle&.min_temperature && vehicle&.max_temperature

    current_temp = temperature_record.temperature
    min_temp = vehicle.min_temperature
    max_temp = vehicle.max_temperature

    if current_temp > max_temp
      create_alert(vehicle, temperature_record, :over_high, max_temp)
    elsif current_temp < min_temp
      create_alert(vehicle, temperature_record, :over_low, min_temp)
    end
  end

  private

  def create_alert(vehicle, temperature_record, alert_type, threshold)
    existing_alert = vehicle.temperature_alerts.where(
      alert_type: alert_type,
      status: :active
    ).first

    if existing_alert
      existing_alert.touch
    else
      vehicle.temperature_alerts.create!(
        alert_type: alert_type,
        temperature: temperature_record.temperature,
        threshold: threshold,
        start_time: temperature_record.recorded_at
      )
    end
  end
end
