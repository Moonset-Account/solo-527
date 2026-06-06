class Api::V1::StudentsController < Api::V1::BaseController
  def index
    authorize_admin!
    students = Student.includes(:user)
    students = students.by_level(params[:level]) if params[:level].present?
    students = students.page(params[:page]).per(params[:per_page] || 20)

    render json: {
      students: students.as_json(
        include: { user: { only: [:id, :name, :phone, :email, :avatar_url, :created_at] } }
      ),
      meta: pagination_meta(students)
    }, status: :ok
  end

  def show
    @student = Student.includes(:user).find(params[:id])
    authorize @student

    render json: @student.as_json(
      include: {
        user: { only: [:id, :name, :phone, :email, :avatar_url] },
        bookings: {
          include: {
            course_session: {
              include: { course: { only: [:id, :title] } },
              only: [:id, :start_time, :end_time, :location]
            }
          },
          only: [:id, :booking_no, :status, :total_amount, :paid_amount, :created_at]
        },
        artworks: { only: [:id, :title, :thumbnail_url, :is_public, :status, :likes_count, :views_count, :created_at] }
      }
    ), status: :ok
  end

  def create
    authorize_admin!
    user = User.find(params[:user_id])
    @student = user.build_student(student_params)

    if @student.save
      user.update!(role: :student)
      render json: @student, status: :created
    else
      render json: { error: @student.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def student_params
    params.permit(:birthday, :emergency_contact, :emergency_phone, :notes, :level)
  end
end
