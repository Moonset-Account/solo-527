module Admin
  class CaretakersController < ApplicationController
    before_action :set_caretaker, only: [:show, :edit, :update, :destroy]

    def index
      @caretakers = Caretaker.order(active: :desc, name: :asc)
    end

    def show
      @current_boardings = @caretaker.boarding_reservations.current.includes(:pet, :kennel)
      @recent_trainings = @caretaker.training_records.order(training_date: :desc).limit(10)
    end

    def new
      @caretaker = Caretaker.new
    end

    def edit; end

    def create
      @caretaker = Caretaker.new(caretaker_params)
      if @caretaker.save
        redirect_to [:admin, @caretaker], notice: "主理人创建成功！"
      else
        render :new, status: :unprocessable_entity
      end
    end

    def update
      if @caretaker.update(caretaker_params)
        redirect_to [:admin, @caretaker], notice: "主理人更新成功！"
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @caretaker.destroy
      redirect_to admin_caretakers_url, notice: "主理人已删除。"
    end

    private

    def set_caretaker
      @caretaker = Caretaker.find(params[:id])
    end

    def caretaker_params
      params.require(:caretaker).permit(
        :name, :phone, :email, :bio, :avatar_url,
        :active, :max_pets_capacity
      )
    end
  end
end
