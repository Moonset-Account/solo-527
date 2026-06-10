class DashboardController < ApplicationController
  before_action :require_login

  def index
    @today_orders = Order.where(created_at: Time.current.all_day).count
    @pending_registrations = Registration.pending.count
    @pending_refunds = Refund.pending.count
    @open_alerts = AttendanceAlert.open.count
    @open_anomalies = RevenueAnomaly.open.count
    @recent_orders = Order.recent.limit(10)
    @low_stock_inventories = Inventory.joins(:ticket_type).where("available < ?", 10)
  end
end
