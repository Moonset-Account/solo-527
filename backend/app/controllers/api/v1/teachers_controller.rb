class Api::V1::TeachersController < Api::V1::BaseController
  skip_before_action :authenticate_user!, only: [:index, :show]

  def index
    teachers = Teacher.active.includes(:user)
    teachers = teachers.by_specialty(params[:specialty]) if params[:specialty].present?
    teachers = teachers.page(params[:page]).per(params[:per_page] || 20)

    render json: {
      teachers: teachers.as_json(
        include: { user: { only: [:id, :name, :avatar_url] } }
      ),
      meta: pagination_meta(teachers)
    }, status: :ok
  end

  def show
    @teacher = Teacher.includes(:user).find(params[:id])
    render json: @teacher.as_json(
      include: {
        user: { only: [:id, :name, :avatar_url, :phone] },
        course_sessions: {
          include: { course: { only: [:id, :title] } },
          only: [:id, :start_time, :end_time, :location, :status]
        }
      },
      methods: [:average_rating]
    ), status: :ok
  end

  def create
    authorize_admin!
    user = User.find(params[:user_id])
    @teacher = user.build_teacher(teacher_params)

    if @teacher.save
      user.update!(role: :teacher)
      render json: @teacher, status: :created
    else
      render json: { error: @teacher.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def teacher_params
    params.permit(:bio, :hourly_rate, :bank_account, :id_card, :status, :hire_date, specialties: [])
  end
end
