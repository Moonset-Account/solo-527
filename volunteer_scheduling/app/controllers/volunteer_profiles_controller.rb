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

  def edit_skills
    authorize @volunteer_profile
    @all_skills = Skill.all
  end

  def update_skills
    authorize @volunteer_profile
    @volunteer_profile.skills.clear
    if params[:skill_ids].present?
      params[:skill_ids].each do |skill_id|
        @volunteer_profile.skills << Skill.find(skill_id)
      end
    end
    redirect_to volunteer_profile_path, notice: "技能更新成功。"
  end

  def edit_availabilities
    authorize @volunteer_profile
  end

  def update_availabilities
    authorize @volunteer_profile
    @volunteer_profile.availabilities.destroy_all
    if params[:availabilities].present?
      params[:availabilities].each do |avail|
        next if avail[:day_of_week].blank?
        @volunteer_profile.availabilities.create!(
          day_of_week: avail[:day_of_week],
          start_time: avail[:start_time],
          end_time: avail[:end_time]
        )
      end
    end
    redirect_to volunteer_profile_path, notice: "可服务时段更新成功。"
  end

  def edit_emergency_contacts
    authorize @volunteer_profile
  end

  def update_emergency_contacts
    authorize @volunteer_profile
    @volunteer_profile.emergency_contacts.destroy_all
    if params[:emergency_contacts].present?
      params[:emergency_contacts].each do |ec|
        next if ec[:name].blank?
        @volunteer_profile.emergency_contacts.create!(
          name: ec[:name],
          relationship: ec[:relationship],
          phone: ec[:phone]
        )
      end
    end
    redirect_to volunteer_profile_path, notice: "紧急联系人更新成功。"
  end

  def edit_guardians
    authorize @volunteer_profile
  end

  def update_guardians
    authorize @volunteer_profile
    @volunteer_profile.guardians.destroy_all
    if params[:guardians].present?
      params[:guardians].each do |g|
        next if g[:name].blank?
        @volunteer_profile.guardians.create!(
          name: g[:name],
          relationship: g[:relationship],
          phone: g[:phone]
        )
      end
    end
    if @volunteer_profile.is_minor? && @volunteer_profile.guardians.empty?
      redirect_to edit_guardians_volunteer_profile_path, alert: "未成年人必须填写至少一位监护人信息。"
      return
    end
    redirect_to volunteer_profile_path, notice: "监护人信息更新成功。"
  end

  private

  def set_volunteer_profile
    @volunteer_profile = current_user.volunteer_profile
  end

  def volunteer_profile_params
    params.require(:volunteer_profile).permit(:birth_date, :gender, :address, :bio)
  end
end
