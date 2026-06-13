module Admin
  class UsersController < ApplicationController
    before_action :set_user, only: [:edit, :update, :destroy]

    def index
      @users = User.all.order(created_at: :desc).page(params[:page]).per(20)
      authorize @users, policy_class: Admin::UserPolicy
    end

    def edit
      authorize @user, policy_class: Admin::UserPolicy
    end

    def update
      authorize @user, policy_class: Admin::UserPolicy
      if @user.update(user_params)
        redirect_to admin_users_path, notice: "用户更新成功。"
      else
        render :edit
      end
    end

    def destroy
      authorize @user, policy_class: Admin::UserPolicy
      if @user == current_user
        redirect_to admin_users_path, alert: "不能删除自己。"
      else
        @user.destroy
        redirect_to admin_users_path, notice: "用户已删除。"
      end
    end

    private

    def set_user
      @user = User.find(params[:id])
    end

    def user_params
      params.require(:user).permit(:name, :email, :phone, :role)
    end
  end
end
