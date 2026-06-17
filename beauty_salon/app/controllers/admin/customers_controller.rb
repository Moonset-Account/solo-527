class Admin::CustomersController < ApplicationController
  layout "admin"

  before_action :set_customer, only: [:show, :edit, :update, :card_items]

  def index
    @customers = Customer.order(:name)
    @customers = @customers.search(params[:q]) if params[:q].present?
  end

  def show
    @treatment_cards = @customer.treatment_cards.includes(:treatment_card_items => :treatment).order(created_at: :desc)
    @appointments = @customer.appointments.includes(:technician, :treatment).order(scheduled_at: :desc).limit(10)
  end

  def new
    @customer = Customer.new
  end

  def create
    @customer = Customer.new(customer_params)
    if @customer.save
      redirect_to admin_customer_path(@customer), notice: "客户创建成功"
    else
      render :new, status: :unprocessable_content
    end
  end

  def edit
  end

  def update
    if @customer.update(customer_params)
      redirect_to admin_customer_path(@customer), notice: "客户更新成功"
    else
      render :edit, status: :unprocessable_content
    end
  end

  def card_items
    items = @customer.treatment_cards.active_only.includes(:treatment_card_items => :treatment).map do |card|
      card.treatment_card_items.select { |item| item.remaining_sessions > 0 }.map do |item|
        { id: item.id, card_number: card.card_number, treatment_name: item.treatment.name, remaining_sessions: item.remaining_sessions, total_sessions: item.total_sessions }
      end
    end.flatten
    render json: items
  end

  private

  def set_customer
    @customer = Customer.find(params[:id])
  end

  def customer_params
    params.require(:customer).permit(:name, :phone, :notes)
  end
end
