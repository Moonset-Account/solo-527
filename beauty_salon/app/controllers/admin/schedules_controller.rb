class Admin::SchedulesController < ApplicationController
  layout "admin"

  before_action :set_schedule, only: [:edit, :update, :destroy]

  def index
    @technicians = Technician.active_only
    @schedules = Schedule.includes(:technician).for_date_range(params[:start_date], params[:end_date]).order(work_date: :desc)
  end

  def new
    @schedule = Schedule.new
    @technicians = Technician.active_only
  end

  def create
    @schedule = Schedule.new(schedule_params)
    if @schedule.save
      AuditLog.create!(auditable: @schedule, action: "create", changes_data: @schedule.attributes, description: "排班创建")
      redirect_to admin_schedules_path, notice: "排班创建成功"
    else
      @technicians = Technician.active_only
      render :new, status: :unprocessable_content
    end
  end

  def edit
    @technicians = Technician.active_only
  end

  def update
    old_attrs = @schedule.attributes.dup
    if @schedule.update(schedule_params)
      AuditLog.create!(auditable: @schedule, action: "update", changes_data: { from: old_attrs, to: @schedule.attributes }, description: "排班更新")
      redirect_to admin_schedules_path, notice: "排班更新成功"
    else
      @technicians = Technician.active_only
      render :edit, status: :unprocessable_content
    end
  end

  def destroy
    @schedule.destroy
    redirect_to admin_schedules_path, notice: "排班已删除"
  end

  private

  def set_schedule
    @schedule = Schedule.find(params[:id])
  end

  def schedule_params
    params.require(:schedule).permit(:technician_id, :work_date, :start_time, :end_time, :status)
  end
end
