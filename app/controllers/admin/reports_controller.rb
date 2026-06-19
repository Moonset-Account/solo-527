class Admin::ReportsController < Admin::BaseController
  def driver_workload
    authorize :report, :driver_workload?

    @start_date = params[:start_date]&.to_date || 30.days.ago.to_date
    @end_date = params[:end_date]&.to_date || Date.current

    @drivers = User.driver.active.includes(:vehicles)
    @workload_data = @drivers.map do |driver|
      settlements = driver.settlements.where(start_date: @start_date..@end_date)
      claims = driver.claims.where(reported_at: @start_date..@end_date)
      {
        driver: driver,
        settlements_count: settlements.count,
        total_amount: settlements.sum(:total_amount),
        claims_count: claims.count,
        vehicles_count: driver.vehicles.count
      }
    end
  end

  def temperature_safety
    authorize :report, :temperature_safety?

    @start_date = params[:start_date]&.to_date || 30.days.ago.to_date
    @end_date = params[:end_date]&.to_date || Date.current

    @vehicles = Vehicle.includes(:temperature_alerts)
    @safety_data = @vehicles.map do |vehicle|
      alerts = vehicle.temperature_alerts.where(start_time: @start_date..@end_date)
      records = vehicle.temperature_records.where(recorded_at: @start_date..@end_date)
      {
        vehicle: vehicle,
        alerts_count: alerts.count,
        records_count: records.count,
        avg_temperature: records.average(:temperature),
        alert_rate: records.count > 0 ? (alerts.count.to_f / records.count * 100).round(2) : 0
      }
    end
  end
end
