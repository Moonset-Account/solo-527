module Admin
  class TeamsController < ApplicationController
    before_action :set_team, only: [:show, :edit, :update, :destroy]

    def index
      @q = Team.ransack(params[:q])
      @teams = @q.result.order(created_at: :desc).page(params[:page]).per(15)
      authorize @teams, policy_class: Admin::TeamPolicy
    end

    def show
      authorize @team, policy_class: Admin::TeamPolicy
    end

    def new
      @team = Team.new
      authorize @team, policy_class: Admin::TeamPolicy
    end

    def create
      @team = Team.new(team_params)
      authorize @team, policy_class: Admin::TeamPolicy
      if @team.save
        redirect_to admin_teams_path, notice: "班组创建成功。"
      else
        render :new
      end
    end

    def edit
      authorize @team, policy_class: Admin::TeamPolicy
    end

    def update
      authorize @team, policy_class: Admin::TeamPolicy
      if @team.update(team_params)
        redirect_to admin_teams_path, notice: "班组更新成功。"
      else
        render :edit
      end
    end

    def destroy
      authorize @team, policy_class: Admin::TeamPolicy
      @team.destroy
      redirect_to admin_teams_path, notice: "班组已删除。"
    end

    private

    def set_team
      @team = Team.find(params[:id])
    end

    def team_params
      params.require(:team).permit(:name, :code, :leader_name, :member_count, :shift)
    end
  end
end
