class Admin::TreatmentsController < ApplicationController
  layout "admin"

  before_action :set_treatment, only: [:show, :edit, :update, :destroy]

  def index
    @treatments = Treatment.by_category(params[:category]).order(:name)
    @categories = Treatment.categories.keys
  end

  def show
    @price_histories = @treatment.price_histories.recent
  end

  def new
    @treatment = Treatment.new
  end

  def create
    @treatment = Treatment.new(treatment_params)
    if @treatment.save
      redirect_to admin_treatment_path(@treatment), notice: "疗程项目创建成功"
    else
      render :new, status: :unprocessable_content
    end
  end

  def edit
  end

  def update
    if @treatment.update(treatment_params)
      redirect_to admin_treatment_path(@treatment), notice: "疗程项目更新成功"
    else
      render :edit, status: :unprocessable_content
    end
  end

  def destroy
    @treatment.update!(active: false)
    redirect_to admin_treatments_path, notice: "疗程项目已停用"
  end

  private

  def set_treatment
    @treatment = Treatment.find(params[:id])
  end

  def treatment_params
    params.require(:treatment).permit(:name, :category, :price, :duration, :description, :active)
  end
end
