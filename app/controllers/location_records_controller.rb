class LocationRecordsController < ApplicationController
  def index
    @q = policy_scope(LocationRecord).ransack(params[:q])
    @location_records = @q.result.includes(:vehicle).order(recorded_at: :desc).page(params[:page]).per(20)
    authorize @location_records
  end
end
