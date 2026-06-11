class RefundRecordsController < ApplicationController
  before_action :set_refund, only: [:show]

  def index
    @q = RefundRecord.includes(:appointment, :appointment_service_item).ransack(params[:q])
    @refund_records = @q.result.order(created_at: :desc).page(params[:page]).per(30)

    @stats = {
      total_count: RefundRecord.count,
      total_amount: RefundRecord.processed.sum(:refund_amount),
      today_count: RefundRecord.on_date(Date.today).count,
      today_amount: RefundRecord.on_date(Date.today).processed.sum(:refund_amount)
    }
  end

  def show; end

  private

  def set_refund
    @refund_record = RefundRecord.find(params[:id])
  end
end
