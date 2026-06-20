module Admin
  class UsersController < BaseController
    before_action :set_user, only: [:show, :edit, :update, :destroy]

    def index
      @q = User.ransack(params[:q])
      @users = @q.result.page(params[:page]).per(20)
    end

    def show
      @enrollments = @user.course_enrollments.includes(:course).order(created_at: :desc).limit(10)
      @event_registrations = @user.event_registrations.includes(:event).order(created_at: :desc).limit(10)
      @payments = @user.payments.order(created_at: :desc).limit(10)
      @versions = @user.versions.reorder(created_at: :desc).limit(10)
    end

    def edit
    end

    def update
      if @user.update(user_params)
        redirect_to [:admin, @user], notice: "用户更新成功。"
      else
        render :edit
      end
    end

    def destroy
      @user.destroy
      redirect_to admin_users_path, notice: "用户已删除。"
    end

    private

    def set_user
      @user = User.find(params[:id])
    end

    def user_params
      params.require(:user).permit(:name, :email, :phone, :role, :active)
    end
  end
end
