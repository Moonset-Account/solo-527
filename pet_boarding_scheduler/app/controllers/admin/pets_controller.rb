module Admin
  class PetsController < ApplicationController
    before_action :set_pet, only: [:show, :edit, :update, :destroy]

    def index
      @q = Pet.ransack(params[:q])
      scope = @q.result.order(created_at: :desc)
      @pagy, @pets = pagy(scope, page: params[:page])
    end

    def show
      @health_records = @pet.health_records.order(recorded_at: :desc).limit(20)
      @training_records = @pet.training_records.order(training_date: :desc).limit(20)
      @boarding_history = @pet.boarding_reservations.order(check_in_at: :desc).limit(10)
    end

    def new
      @pet = Pet.new
    end

    def edit; end

    def create
      @pet = Pet.new(pet_params)
      if @pet.save
        redirect_to [:admin, @pet], notice: "宠物档案创建成功！"
      else
        render :new, status: :unprocessable_entity
      end
    end

    def update
      if @pet.update(pet_params)
        redirect_to [:admin, @pet], notice: "宠物档案更新成功！"
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @pet.destroy
      redirect_to admin_pets_url, notice: "宠物档案已删除。"
    end

    private

    def set_pet
      @pet = Pet.find(params[:id])
    end

    def pet_params
      params.require(:pet).permit(
        :name, :species, :breed, :age, :weight, :gender,
        :owner_name, :owner_phone, :owner_email,
        :medical_notes, :allergies, :special_needs,
        :avatar_url, :active
      )
    end
  end
end
