class ActivitiesController < ApplicationController
  before_action :set_activity, only: [:show, :edit, :update, :destroy, :publish]

  def index
    @activities = Activity.all.order(created_at: :desc)
    authorize @activities
  end

  def show
    authorize @activity
    @locations = @activity.locations
    @assignments = @activity.assignments.includes(:volunteer_profile)
  end

  def new
    @activity = Activity.new
    authorize @activity
  end

  def edit
    authorize @activity
  end

  def create
    @activity = Activity.new(activity_params)
    @activity.project_manager = current_user
    authorize @activity

    if @activity.save
      redirect_to @activity, notice: "活动创建成功。"
    else
      render :new
    end
  end

  def update
    authorize @activity
    if @activity.update(activity_params)
      redirect_to @activity, notice: "活动更新成功。"
    else
      render :edit
    end
  end

  def destroy
    authorize @activity
    @activity.destroy
    redirect_to activities_url, notice: "活动已删除。"
  end

  def publish
    authorize @activity, :publish?
    if @activity.draft?
      @activity.published!
      redirect_to @activity, notice: "活动已发布。"
    else
      redirect_to @activity, alert: "只有草稿状态的活动可以发布。"
    end
  end

  private

  def set_activity
    @activity = Activity.find(params[:id])
  end

  def activity_params
    params.require(:activity).permit(:title, :description, :start_time, :end_time, :category, :volunteers_needed)
  end
end
