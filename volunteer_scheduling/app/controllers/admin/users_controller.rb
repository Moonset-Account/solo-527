class Admin::UsersController < ApplicationController
  before_action :authorize_admin!

  def index
    @users = User.order(created_at: :desc).page(params[:page]).per(20)
  end

  def show
    @user = User.find(params[:id])
  end

  def edit
    @user = User.find(params[:id])
  end

  def update
    @user = User.find(params[:id])
    if @user.update(user_params)
      redirect_to admin_user_path(@user), notice: "用户信息更新成功。"
    else
      render :edit
    end
  end

  def destroy
    @user = User.find(params[:id])
    @user.destroy
    redirect_to admin_users_path, notice: "用户已删除。"
  end

  private

  def authorize_admin!
    authorize :admin, :access?
  end

  def user_params
    params.require(:user).permit(:name, :email, :role, :phone)
  end
end
