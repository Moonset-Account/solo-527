class Admin::TechniciansController < ApplicationController
  layout "admin"

  before_action :set_technician, only: [:show, :edit, :update, :destroy]

  def index
    @technicians = Technician.active_only.order(:name)
  end

  def show
    @schedules = @technician.schedules.order(work_date: :desc).limit(30)
  end

  def new
    @technician = Technician.new
  end

  def create
    @technician = Technician.new(technician_params)
    if @technician.save
      redirect_to admin_technician_path(@technician), notice: "技师创建成功"
    else
      render :new, status: :unprocessable_content
    end
  end

  def edit
  end

  def update
    if @technician.update(technician_params)
      redirect_to admin_technician_path(@technician), notice: "技师更新成功"
    else
      render :edit, status: :unprocessable_content
    end
  end

  def destroy
    @technician.update!(active: false)
    redirect_to admin_technicians_path, notice: "技师已停用"
  end

  private

  def set_technician
    @technician = Technician.find(params[:id])
  end

  def technician_params
    params.require(:technician).permit(:name, :phone, :specialty, :active)
  end
end
