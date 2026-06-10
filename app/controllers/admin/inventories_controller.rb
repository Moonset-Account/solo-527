class Admin::InventoriesController < ApplicationController
  before_action :require_login
  before_action :require_admin

  def index
    @inventories = Inventory.includes(ticket_type: :event).all
    @inventories = @inventories.joins(:ticket_type).where(ticket_types: { event_id: params[:event_id] }) if params[:event_id].present?
    @inventories = @inventories.where("available < ?", params[:threshold]) if params[:threshold].present?
    @saved_filters = SavedFilterService.new(current_user).list(filterable_type: "Inventory")
  end

  def update
    @inventory = Inventory.find(params[:id])
    InventoryService.new.set_total(@inventory.ticket_type, params[:total].to_i)
    redirect_to admin_inventories_path, notice: "库存已更新"
  end
end
