class Admin::SavedFiltersController < ApplicationController
  before_action :require_login
  before_action :require_admin

  def index
    @saved_filters = current_user.saved_filters.recent
    @saved_filters = @saved_filters.where(filterable_type: params[:filterable_type]) if params[:filterable_type].present?
  end

  def create
    filter_params = params[:saved_filter] || params
    service = SavedFilterService.new(current_user)
    conditions = filter_params[:conditions]
    conditions = conditions.to_unsafe_h if conditions.respond_to?(:to_unsafe_h)
    @filter = service.save(
      filterable_type: filter_params[:filterable_type],
      name: filter_params[:name],
      conditions: conditions || {}
    )
    redirect_back fallback_location: admin_saved_filters_path, notice: "筛选已保存"
  end

  def destroy
    @filter = current_user.saved_filters.find(params[:id])
    @filter.destroy
    redirect_to admin_saved_filters_path, notice: "筛选已删除"
  end
end
