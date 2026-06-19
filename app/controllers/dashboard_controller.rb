class DashboardController < ApplicationController
  def index
    authorize :dashboard, :index?

    @vehicles_count = Vehicle.count
    @active_vehicles_count = Vehicle.active.count
    @temperature_alerts_count = TemperatureAlert.active.count
    @today_claims_count = Claim.where(reported_at: Date.current.beginning_of_day..Date.current.end_of_day).count

    @recent_vehicles = Vehicle.order(updated_at: :desc).limit(10)
    @active_alerts = TemperatureAlert.active.includes(:vehicle).order(created_at: :desc).limit(5)
    @recent_claims = Claim.includes(:vehicle, :driver).order(created_at: :desc).limit(5)
  end
end
