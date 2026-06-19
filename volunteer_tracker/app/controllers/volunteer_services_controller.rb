class VolunteerServicesController < ApplicationController
  before_action :set_volunteer_service, only: [:show, :edit, :update, :destroy, :activate, :pause, :resume, :complete]

  def index
    @q = VolunteerService.ransack(params[:q])
    @volunteer_services = @q.result.order(created_at: :desc)
  end

  def show
  end

  def new
    @volunteer_service = VolunteerService.new
  end

  def create
    @volunteer_service = VolunteerService.new(volunteer_service_params)
    if @volunteer_service.save
      redirect_to @volunteer_service, notice: "Volunteer service was successfully created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @volunteer_service.update(volunteer_service_params)
      redirect_to @volunteer_service, notice: "Volunteer service was successfully updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @volunteer_service.destroy!
    redirect_to volunteer_services_url, notice: "Volunteer service was successfully destroyed."
  end

  def activate
    @volunteer_service.activate!
    redirect_to @volunteer_service, notice: "Service activated."
  end

  def pause
    @volunteer_service.pause!
    redirect_to @volunteer_service, notice: "Service paused."
  end

  def resume
    @volunteer_service.resume!
    redirect_to @volunteer_service, notice: "Service resumed."
  end

  def complete
    @volunteer_service.complete!
    redirect_to @volunteer_service, notice: "Service completed."
  end

  private

  def set_volunteer_service
    @volunteer_service = VolunteerService.find(params[:id])
  end

  def volunteer_service_params
    params.require(:volunteer_service).permit(:title, :description, :category, :status, :start_date, :end_date)
  end
end
