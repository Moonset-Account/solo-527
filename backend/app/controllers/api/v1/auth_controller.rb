class Api::V1::AuthController < Api::V1::BaseController
  skip_before_action :authenticate_user!, only: [:login, :register]

  def login
    user = User.find_by(phone: params[:phone])

    if user && user.authenticate(params[:password])
      user.update!(last_login_at: Time.current)
      token = JsonWebToken.encode(user_id: user.id)
      render json: {
        token: token,
        user: user.as_json(only: [:id, :name, :phone, :email, :role, :avatar_url]),
        teacher: user.teacher.as_json(only: [:id, :status, :specialties]),
        student: user.student.as_json(only: [:id, :level])
      }, status: :ok
    else
      render json: { error: '手机号或密码错误' }, status: :unauthorized
    end
  end

  def register
    user = User.new(user_params)
    user.role = params[:role] || :student

    if user.save
      if user.student?
        user.create_student!
      end

      token = JsonWebToken.encode(user_id: user.id)
      render json: {
        token: token,
        user: user.as_json(only: [:id, :name, :phone, :email, :role])
      }, status: :created
    else
      render json: { error: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def me
    render json: {
      user: current_user.as_json(only: [:id, :name, :phone, :email, :role, :avatar_url]),
      teacher: current_user.teacher&.as_json(only: [:id, :status, :specialties, :hourly_rate]),
      student: current_user.student&.as_json(only: [:id, :level, :total_courses, :total_spent])
    }, status: :ok
  end

  def update_profile
    if current_user.update(profile_params)
      render json: current_user.as_json(only: [:id, :name, :phone, :email, :avatar_url]), status: :ok
    else
      render json: { error: current_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.permit(:name, :phone, :email, :password, :password_confirmation)
  end

  def profile_params
    params.permit(:name, :email, :avatar_url)
  end
end
