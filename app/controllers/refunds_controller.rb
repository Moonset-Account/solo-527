class RefundsController < ApplicationController
  before_action :require_login

  def index
    @refunds = current_user.refunds.recent
  end

  def show
    @refund = current_user.refunds.find(params[:id])
  end

  def new
    @order = current_user.orders.find(params[:order_id])
    @refund = @order.refunds.new(amount: @order.total_amount)
  end

  def create
    refund_params = params[:refund] || params
    @order = current_user.orders.find(refund_params[:order_id])
    service = RefundService.new(current_user)
    @refund = service.create_refund(
      @order,
      reason: refund_params[:reason],
      amount: refund_params[:amount]
    )
    redirect_to @refund, notice: "退票申请已提交"
  rescue => e
    redirect_back fallback_location: orders_path, alert: e.message
  end
end
