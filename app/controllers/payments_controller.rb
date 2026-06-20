class PaymentsController < ApplicationController
  before_action :set_payment, only: [:show]

  def index
    @payments = current_user.payments.includes(:payable).order(created_at: :desc).page(params[:page]).per(20)
  end

  def show
    authorize @payment
  end

  private

  def set_payment
    @payment = Payment.find(params[:id])
  end
end
