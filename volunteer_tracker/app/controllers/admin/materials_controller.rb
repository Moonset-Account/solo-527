class Admin::MaterialsController < ApplicationController
  before_action :require_admin!
  before_action :set_material, only: [:show, :edit, :update, :destroy]

  def index
    @materials = Material.order(:name)
    if params[:category].present?
      @materials = @materials.where(category: params[:category])
    end
    if params[:low_stock].present?
      @materials = @materials.where("quantity <= threshold")
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
    if @material.save
      redirect_to admin_materials_url, notice: "Material was successfully created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @material.update(material_params)
      redirect_to admin_materials_url, notice: "Material was successfully updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @material.destroy!
    redirect_to admin_materials_url, notice: "Material was successfully destroyed."
  end

  private

  def set_material
    @material = Material.find(params[:id])
  end

  def material_params
    params.require(:material).permit(:name, :category, :unit, :quantity, :threshold)
  end
end
