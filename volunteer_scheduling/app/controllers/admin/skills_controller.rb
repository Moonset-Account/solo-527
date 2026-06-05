class Admin::SkillsController < ApplicationController
  before_action :authorize_admin!
  before_action :set_skill, only: [:edit, :update, :destroy]

  def index
    @skills = Skill.order(created_at: :desc)
    @skill = Skill.new
  end

  def create
    @skill = Skill.new(skill_params)
    if @skill.save
      redirect_to admin_skills_path, notice: "技能创建成功。"
    else
      @skills = Skill.order(created_at: :desc)
      render :index
    end
  end

  def update
    if @skill.update(skill_params)
      redirect_to admin_skills_path, notice: "技能更新成功。"
    else
      @skills = Skill.order(created_at: :desc)
      render :index
    end
  end

  def destroy
    @skill.destroy
    redirect_to admin_skills_path, notice: "技能已删除。"
  end

  private

  def authorize_admin!
    authorize :admin, :access?
  end

  def set_skill
    @skill = Skill.find(params[:id])
  end

  def skill_params
    params.require(:skill).permit(:name, :category, :description)
  end
end
