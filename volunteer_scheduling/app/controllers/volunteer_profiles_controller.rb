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
    
    if params[:availabilities].is_a?(ActionController::Parameters)
      params[:availabilities].each_value do |avail_params|
        day = avail_params[:day_of_week]
        start_time = avail_params[:start_time]
        end_time = avail_params[:end_time]
        destroy_flag = avail_params[:_destroy] == "1"
        
        next if destroy_flag || start_time.blank? || end_time.blank? || day.blank?
        
        @volunteer_profile.availabilities.create!(
          day_of_week: day.to_i,
          start_time: start_time,
          end_time: end_time
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
    
    if params[:emergency_contacts].is_a?(ActionController::Parameters)
      params[:emergency_contacts].each_value do |ec_params|
        name = ec_params[:name]
        relationship = ec_params[:relationship]
        phone = ec_params[:phone]
        
        next if name.blank?
        
        @volunteer_profile.emergency_contacts.create!(
          name: name,
          relationship: relationship,
          phone: phone
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
    
    valid_count = 0
    if params[:guardians].is_a?(ActionController::Parameters)
      params[:guardians].each_value do |g_params|
        name = g_params[:name]
        relationship = g_params[:relationship]
        phone = g_params[:phone]
        
        next if name.blank?
        
        @volunteer_profile.guardians.create!(
          name: name,
          relationship: relationship,
          phone: phone
        )
        valid_count += 1
      end
    end
    
    if @volunteer_profile.is_minor? && valid_count == 0
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
