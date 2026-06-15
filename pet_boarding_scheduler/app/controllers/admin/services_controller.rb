module Admin
  class ServicesController < ApplicationController
    before_action :set_service, only: [:show, :edit, :update, :destroy]

    def index
      @services = Service.order(category: :asc, name: :asc)
      @services = @services.where(is_active: true) if params[:active_only]
    end

    def show; end

    def new
      @service = Service.new
    end

    def edit; end

    def create
      @service = Service.new(service_params)
      if @service.save
        redirect_to [:admin, @service], notice: "服务创建成功！"
      else
        render :new, status: :unprocessable_entity
      end
    end

    def update
      if @service.update(service_params)
        redirect_to [:admin, @service], notice: "服务更新成功！"
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @service.destroy
      redirect_to admin_services_url, notice: "服务已删除。"
    end

    private

    def set_service
      @service = Service.find(params[:id])
    end

    def service_params
      params.require(:service).permit(
        :name, :description, :duration_minutes, :price,
        :category, :is_active
      )
    end
  end
end
