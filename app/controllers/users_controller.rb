class UsersController < ApplicationController
  before_action :set_user, only: [:show, :edit, :update, :destroy]

  def index
    authorize User
    @q = policy_scope(User).ransack(params[:q])
    @users = @q.result.includes(:department).ordered.page(params[:page]).per(20)
  end

  def show
    authorize @user
    @submitted_tickets = @user.submitted_tickets.recent.page(params[:submitted_page]).per(10)
    @assigned_tickets = @user.assigned_tickets.recent.page(params[:assigned_page]).per(10)
  end

  def edit
    authorize @user
  end

  def update
    authorize @user
    if @user.update(user_params)
      redirect_to @user, notice: '用户信息更新成功。'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @user
    @user.destroy
    redirect_to users_url, notice: '用户已删除。'
  end

  private

  def set_user
    @user = User.find(params[:id])
  end

  def user_params
    allowed = [:name, :email, :department_id]
    allowed += [:role] if current_user.executive?
    if params[:user][:password].blank?
      params.require(:user).permit(allowed)
    else
      params.require(:user).permit(allowed + [:password, :password_confirmation])
    end
  end
end
