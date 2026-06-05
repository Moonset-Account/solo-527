class LocationsController < ApplicationController
  before_action :set_activity
  before_action :set_location, only: [:show, :edit, :update, :destroy]

  def show
    authorize @location
  end

  def new
    @location = @activity.locations.new
    authorize @location
  end

  def edit
    authorize @location
  end

  def create
    @location = @activity.locations.new(location_params)
    authorize @location

    if @location.save
      if params[:skill_ids].present?
        params[:skill_ids].each do |skill_id|
          @location.required_skills << Skill.find(skill_id)
        end
      end
      redirect_to activity_path(@activity), notice: "点位创建成功。"
    else
      render :new
    end
  end

  def update
    authorize @location
    if @location.update(location_params)
      @location.required_skills.clear
      if params[:skill_ids].present?
        params[:skill_ids].each do |skill_id|
          @location.required_skills << Skill.find(skill_id)
        end
      end
      redirect_to activity_path(@activity), notice: "点位更新成功。"
    else
      render :edit
    end
  end

  def destroy
    authorize @location
    @location.destroy
    redirect_to activity_path(@activity), notice: "点位已删除。"
  end

  private

  def set_activity
    @activity = Activity.find(params[:activity_id])
  end

  def set_location
    @location = @activity.locations.find(params[:id])
  end

  def location_params
    params.require(:location).permit(:name, :address, :latitude, :longitude, :description)
  end
end
