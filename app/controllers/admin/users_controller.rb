class Admin::UsersController < Admin::BaseController
  def index
    @q = policy_scope(User).ransack(params[:q])
    @users = @q.result.order(created_at: :desc).page(params[:page]).per(20)
    authorize @users
  end

  def show
    @user = User.find(params[:id])
    authorize @user
  end

  def new
    @user = User.new
    authorize @user
  end

  def create
    @user = User.new(user_params)
    authorize @user

    if @user.save
      OperationLog.log(current_user, 'create_user', @user)
      redirect_to [:admin, @user], notice: '用户创建成功。'
    else
      render :new
    end
  end

  def edit
    @user = User.find(params[:id])
    authorize @user
  end

  def update
    @user = User.find(params[:id])
    authorize @user

    if @user.update(user_params)
      OperationLog.log(current_user, 'update_user', @user)
      redirect_to [:admin, @user], notice: '用户更新成功。'
    else
      render :edit
    end
  end

  def destroy
    @user = User.find(params[:id])
    authorize @user

    @user.destroy
    OperationLog.log(current_user, 'destroy_user', @user)
    redirect_to admin_users_path, notice: '用户已删除。'
  end

  private

  def user_params
    params.require(:user).permit(:email, :password, :password_confirmation, :name, :role, :status, :phone)
  end
end
