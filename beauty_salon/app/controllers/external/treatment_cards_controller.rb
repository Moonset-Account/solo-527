class External::TreatmentCardsController < ApplicationController
  layout "external"

  before_action :set_customer

  def index
    @treatment_cards = @customer.treatment_cards.includes(:treatment_card_items => :treatment).order(created_at: :desc)
  end

  def show
    @treatment_card = @customer.treatment_cards.includes(:treatment_card_items => :treatment).find(params[:id])
  end

  private

  def set_customer
    @customer = Customer.find(params[:customer_id])
  end
end
