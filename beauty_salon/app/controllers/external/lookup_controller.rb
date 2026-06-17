class External::LookupController < ApplicationController
  layout "external"

  def index
  end

  def search
    @query = params[:q].to_s.strip
    @results = []

    if @query.present?
      customers = Customer.where("phone ILIKE ?", "%#{@query}%")
      cards = TreatmentCard.where("card_number ILIKE ?", "%#{@query}%")

      customers.each do |c|
        @results << { type: "customer", record: c }
      end

      cards.each do |card|
        @results << { type: "card", record: card } unless customers.include?(card.customer)
      end

      if customers.size == 1 && cards.empty?
        redirect_to external_customer_treatment_cards_path(customers.first)
        return
      end

      if cards.size == 1 && customers.empty?
        redirect_to external_customer_treatment_card_path(cards.first.customer, cards.first)
        return
      end
    end
  end
end
