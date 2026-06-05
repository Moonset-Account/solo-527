class VolunteerProfilesController < ApplicationController
  before_action :set_volunteer_profile

  def show
    authorize @volunteer_profile
  end

  def edit
    authorize @volunteer_profile
  end

  def update
    authorize @volunteer_profile
    if @volunteer_profile.update(volunteer_profile_params)
      redirect_to volunteer_profile_path, notice: "个人信息更新成功。"
    else
      render :edit
    end
  end

  private

  def set_volunteer_profile
    @volunteer_profile = current_user.volunteer_profile
  end

  def volunteer_profile_params
    params.require(:volunteer_profile).permit(:birth_date, :gender, :address, :bio)
  end
end
