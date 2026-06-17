class External::TreatmentsController < ApplicationController
  layout "external"

  def index
    @treatments = Treatment.active_only.by_category(params[:category]).order(:name)
    @categories = Treatment.categories.keys
  end

  def show
    @treatment = Treatment.active_only.find(params[:id])
  end
end
