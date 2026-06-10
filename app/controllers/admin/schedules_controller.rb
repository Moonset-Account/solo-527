class Admin::SchedulesController < ApplicationController
  before_action :require_login
  before_action :require_admin

  def index
    @schedules = Schedule.includes(:event).ordered
    @schedules = @schedules.where(event_id: params[:event_id]) if params[:event_id].present?
    @saved_filters = SavedFilterService.new(current_user).list(filterable_type: "Schedule")
  end

  def show
    @schedule = Schedule.find(params[:id])
  end

  def new
    @schedule = Schedule.new
  end

  def create
    @schedule = Schedule.new(schedule_params)
    if @schedule.save
      redirect_to [:admin, @schedule], notice: "赛程创建成功"
    else
      render :new, status: :unprocessable_content
    end
  end

  def edit
    @schedule = Schedule.find(params[:id])
  end

  def update
    @schedule = Schedule.find(params[:id])
    if @schedule.update(schedule_params)
      redirect_to [:admin, @schedule], notice: "赛程更新成功"
    else
      render :edit, status: :unprocessable_content
    end
  end

  def destroy
    @schedule = Schedule.find(params[:id])
    @schedule.destroy
    redirect_to admin_schedules_path, notice: "赛程已删除"
  end

  private

  def schedule_params
    params.require(:schedule).permit(:event_id, :name, :starts_at, :ends_at, :venue, :sort_order)
  end
end
