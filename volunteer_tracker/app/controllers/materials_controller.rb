class MaterialsController < ApplicationController
  before_action :require_admin!, except: [:index, :show]
  before_action :set_material, only: [:show, :edit, :update, :destroy]

  def index
    @materials = Material.includes(:material_transactions).order(:name)
    if params[:category].present?
      @materials = @materials.where(category: params[:category])
    end
    if params[:search].present?
      @materials = @materials.where("name ILIKE ?", "%#{params[:search]}%")
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
    ActiveRecord::Base.transaction do
      if @material.save
        if params[:material][:initial_quantity].present? && params[:material][:initial_quantity].to_i > 0
          MaterialTransaction.create!(
            material: @material,
            transaction_type: 'in',
            quantity: params[:material][:initial_quantity].to_i,
            operator: current_user,
            remark: '初始库存入库'
          )
        end
      else
        raise ActiveRecord::Rollback
      end
    end
    if @material.persisted?
      redirect_to @material, notice: "物资已创建成功。"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @material.update(material_params)
      redirect_to @material, notice: "Material was successfully updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @material.destroy!
    redirect_to materials_url, notice: "Material was successfully destroyed."
  end

  private

  def set_material
    @material = Material.find(params[:id])
  end

  def material_params
    params.require(:material).permit(:name, :category, :unit, :initial_quantity, :threshold)
  end
end
