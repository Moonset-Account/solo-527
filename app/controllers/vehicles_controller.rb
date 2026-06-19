class VehiclesController < ApplicationController
  def index
    @q = policy_scope(Vehicle).ransack(params[:q])
    @vehicles = @q.result.page(params[:page]).per(20)
    authorize @vehicles
  end

  def show
    @vehicle = Vehicle.find(params[:id])
    authorize @vehicle

    @latest_temperature = @vehicle.temperature_records.order_by_time.first
    @latest_location = @vehicle.location_records.order_by_time.first
    @recent_temperatures = @vehicle.temperature_records.order_by_time.limit(20)
  end

  def temperature_history
    @vehicle = Vehicle.find(params[:id])
    authorize @vehicle

    start_time = params[:start_time]&.to_time || 24.hours.ago
    end_time = params[:end_time]&.to_time || Time.current

    @temperature_records = @vehicle.temperature_records
                                   .in_time_range(start_time, end_time)
                                   .order(recorded_at: :asc)

    respond_to do |format|
      format.json do
        render json: @temperature_records.map { |r| { time: r.recorded_at, temperature: r.temperature } }
      end
      format.html
    end
  end

  def track_playback
    @vehicle = Vehicle.find(params[:id])
    authorize @vehicle

    start_time = params[:start_time]&.to_time || 24.hours.ago
    end_time = params[:end_time]&.to_time || Time.current

    @location_records = @vehicle.location_records
                               .in_time_range(start_time, end_time)
                               .order(recorded_at: :asc)
  end
end
