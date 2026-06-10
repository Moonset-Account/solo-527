class OrdersController < ApplicationController
  before_action :require_login

  def index
    @orders = current_user.orders.recent
    @orders = @orders.where(status: params[:status]) if params[:status].present?
  end

  def show
    @order = current_user.orders.find(params[:id])
  end

  def create
    service = OrderService.new(current_user)
    @order = service.create_order(
      ticket_type_id: params[:ticket_type_id],
      quantity: params[:quantity].to_i,
      holder_name: params[:holder_name]
    )
    redirect_to @order, notice: "订单创建成功"
  rescue => e
    redirect_back fallback_location: events_path, alert: e.message
  end

  def pay
    @order = current_user.orders.find(params[:id])
    service = OrderService.new(current_user)
    service.pay_order(@order)
    redirect_to @order, notice: "支付成功，已出票"
  rescue => e
    redirect_to @order, alert: e.message
  end
end
