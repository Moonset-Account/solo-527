class ServiceItemsController < ApplicationController
  before_action :set_service_item, only: [:show, :edit, :update, :destroy]

  def index
    @q = ServiceItem.ransack(params[:q])
    @service_items = @q.result.page(params[:page]).per(20)
  end

  def show; end

  def new
    @service_item = ServiceItem.new
  end

  def create
    @service_item = ServiceItem.new(service_item_params)
    if @service_item.save
      redirect_to @service_item, notice: "服务项目创建成功"
    else
      render :new
    end
  end

  def edit; end

  def update
    if @service_item.update(service_item_params)
      redirect_to @service_item, notice: "服务项目更新成功"
    else
      render :edit
    end
  end

  def destroy
    @service_item.destroy
    redirect_to service_items_url, notice: "服务项目已删除"
  end

  private

  def set_service_item
    @service_item = ServiceItem.find(params[:id])
  end

  def service_item_params
    params.require(:service_item).permit(:code, :name, :price, :duration_minutes, :category, :description, :active)
  end
end
