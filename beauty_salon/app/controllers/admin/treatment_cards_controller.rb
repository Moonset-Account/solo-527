class Admin::TreatmentCardsController < ApplicationController
  layout "admin"

  before_action :set_treatment_card, only: [:show, :edit, :update, :destroy]

  def index
    @treatment_cards = TreatmentCard.includes(:customer, :treatment_card_items => :treatment)
    @treatment_cards = @treatment_cards.where(status: params[:status]) if params[:status].present?
    @treatment_cards = @treatment_cards.where(customer_id: params[:customer_id]) if params[:customer_id].present?
    @treatment_cards = @treatment_cards.order(created_at: :desc)
  end

  def show
    @audit_logs = AuditLog.by_auditable("TreatmentCard", @treatment_card.id).recent
  end

  def new
    @treatment_card = TreatmentCard.new
    @treatment_card.treatment_card_items.build
  end

  def create
    @treatment_card = TreatmentCard.new(treatment_card_params)
    if @treatment_card.save
      redirect_to admin_treatment_card_path(@treatment_card), notice: "疗程卡创建成功"
    else
      render :new, status: :unprocessable_content
    end
  end

  def edit
  end

  def update
    if @treatment_card.update(treatment_card_params)
      redirect_to admin_treatment_card_path(@treatment_card), notice: "疗程卡更新成功"
    else
      render :edit, status: :unprocessable_content
    end
  end

  def destroy
    @treatment_card.update!(status: :refunded)
    redirect_to admin_treatment_cards_path, notice: "疗程卡已退款"
  end

  private

  def set_treatment_card
    @treatment_card = TreatmentCard.find(params[:id])
  end

  def treatment_card_params
    params.require(:treatment_card).permit(:customer_id, :card_number, :total_amount, :remaining_amount, :status, :purchased_at, :expired_at, treatment_card_items_attributes: [:id, :treatment_id, :total_sessions, :remaining_sessions, :_destroy])
  end
end
