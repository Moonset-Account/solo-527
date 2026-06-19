class Admin::MaterialsController < ApplicationController
  before_action :require_admin!
  before_action :set_material, only: [:show, :edit, :update, :destroy]

  def index
    @materials = Material.includes(:material_transactions).order(:name)
    if params[:category].present?
      @materials = @materials.where(category: params[:category])
    end
    if params[:low_stock].present?
      @materials = @materials.select { |m| m.low_stock? }
    end
    @categories = Material.distinct.pluck(:category).compact.sort
  end

  def show
  end

  def new
    @material = Material.new
  end

  def create
    @material = Material.new(material_params)
    initial_qty = params[:material][:initial_quantity].to_i
    ActiveRecord::Base.transaction do
      if @material.save
        if initial_qty > 0
          MaterialTransaction.create!(
            material: @material,
            transaction_type: 'in',
            quantity: initial_qty,
            operator: current_user,
            remark: '初始库存入库'
          )
        end
      else
        raise ActiveRecord::Rollback
      end
    end
    if @material.persisted?
      redirect_to admin_materials_url, notice: "物资已创建成功。"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @material.update(material_params)
      redirect_to admin_materials_url, notice: "物资已更新成功。"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @material.destroy!
    redirect_to admin_materials_url, notice: "物资已删除成功。"
  end

  private

  def set_material
    @material = Material.find(params[:id])
  end

  def material_params
    params.require(:material).permit(:name, :category, :unit, :threshold)
  end
end
