class Admin::DashboardController < ApplicationController
  before_action :require_admin!

  def index
    @total_users = User.count
    @total_shifts = Shift.count
    @active_services = VolunteerService.where(status: "active").count
    @low_stock_materials = Material.all.select { |m| m.low_stock? }.count
  end
end
