class Admin::SavedFiltersController < ApplicationController
  before_action :require_login
  before_action :require_admin

  def index
    @saved_filters = current_user.saved_filters.recent
    @saved_filters = @saved_filters.where(filterable_type: params[:filterable_type]) if params[:filterable_type].present?
  end

  def create
    service = SavedFilterService.new(current_user)
    @filter = service.save(
      filterable_type: params[:filterable_type],
      name: params[:name],
      conditions: params[:conditions]
    )
    redirect_back fallback_location: admin_saved_filters_path, notice: "筛选已保存"
  end

  def destroy
    @filter = current_user.saved_filters.find(params[:id])
    @filter.destroy
    redirect_to admin_saved_filters_path, notice: "筛选已删除"
  end
end
