module Admin
  class EquipmentController < ApplicationController
    before_action :set_equipment, only: [:show, :edit, :update, :destroy]

    def index
      @q = Equipment.ransack(params[:q])
      @equipment = @q.result.order(created_at: :desc).page(params[:page]).per(15)
      authorize @equipment, policy_class: Admin::EquipmentPolicy
    end

    def show
      authorize @equipment, policy_class: Admin::EquipmentPolicy
    end

    def new
      @equipment = Equipment.new
      authorize @equipment, policy_class: Admin::EquipmentPolicy
    end

    def create
      @equipment = Equipment.new(equipment_params)
      authorize @equipment, policy_class: Admin::EquipmentPolicy
      if @equipment.save
        redirect_to admin_equipment_index_path, notice: "设备创建成功。"
      else
        render :new
      end
    end

    def edit
      authorize @equipment, policy_class: Admin::EquipmentPolicy
    end

    def update
      authorize @equipment, policy_class: Admin::EquipmentPolicy
      if @equipment.update(equipment_params)
        redirect_to admin_equipment_index_path, notice: "设备更新成功。"
      else
        render :edit
      end
    end

    def destroy
      authorize @equipment, policy_class: Admin::EquipmentPolicy
      @equipment.destroy
      redirect_to admin_equipment_index_path, notice: "设备已删除。"
    end

    private

    def set_equipment
      @equipment = Equipment.find(params[:id])
    end

    def equipment_params
      params.require(:equipment).permit(:name, :code, :equipment_type, :status, :location, :purchase_date, :last_maintenance_date, :standard_output_per_hour)
    end
  end
end
