module Admin
  class KennelsController < ApplicationController
    before_action :set_kennel, only: [:show, :edit, :update, :destroy]

    def index
      @kennels = Kennel.order(:name)
    end

    def show
      @current_pet = @kennel.current_pet
    end

    def new
      @kennel = Kennel.new
    end

    def edit; end

    def create
      @kennel = Kennel.new(kennel_params)
      if @kennel.save
        redirect_to [:admin, @kennel], notice: "笼位创建成功！"
      else
        render :new, status: :unprocessable_entity
      end
    end

    def update
      if @kennel.update(kennel_params)
        redirect_to [:admin, @kennel], notice: "笼位更新成功！"
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @kennel.destroy
      redirect_to admin_kennels_url, notice: "笼位已删除。"
    end

    private

    def set_kennel
      @kennel = Kennel.find(params[:id])
    end

    def kennel_params
      params.require(:kennel).permit(
        :name, :size_category, :location, :status,
        :daily_rate, :notes
      )
    end
  end
end
