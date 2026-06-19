class TemperatureRecordsController < ApplicationController
  def index
    @q = policy_scope(TemperatureRecord).ransack(params[:q])
    @temperature_records = @q.result.includes(:vehicle).order(recorded_at: :desc).page(params[:page]).per(20)
    authorize @temperature_records
  end
end
