class CustomersController < ApplicationController
  before_action :set_customer, only: [:show, :edit, :update, :destroy]

  def index
    @q = Customer.ransack(params[:q])
    @customers = @q.result.page(params[:page]).per(20)
  end

  def show
    @appointments = @customer.appointments.includes(:doctor, :time_slot).order(created_at: :desc).limit(20)
    @waiting_lists = @customer.waiting_lists.includes(:doctor, :time_slot).order(created_at: :desc).limit(10)
  end

  def new
    @customer = Customer.new
  end

  def create
    @customer = Customer.new(customer_params)
    if @customer.save
      redirect_to @customer, notice: "客户创建成功"
    else
      render :new
    end
  end

  def edit; end

  def update
    if @customer.update(customer_params)
      redirect_to @customer, notice: "客户信息更新成功"
    else
      render :edit
    end
  end

  def destroy
    @customer.destroy
    redirect_to customers_url, notice: "客户已删除"
  end

  private

  def set_customer
    @customer = Customer.find(params[:id])
  end

  def customer_params
    params.require(:customer).permit(:name, :phone, :id_card, :birthday, :gender, :address, :vip, :notes)
  end
end
