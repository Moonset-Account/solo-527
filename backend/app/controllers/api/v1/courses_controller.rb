class Api::V1::CoursesController < Api::V1::BaseController
  skip_before_action :authenticate_user!, only: [:index, :show, :calendar]

  def index
    authorize Course
    courses = policy_scope(Course)
    courses = courses.by_category(params[:category_id]) if params[:category_id].present?
    courses = courses.by_difficulty(params[:difficulty]) if params[:difficulty].present?
    courses = courses.order_by_rating if params[:sort] == 'rating'
    courses = courses.order_by_bookings if params[:sort] == 'popular'
    courses = courses.page(params[:page]).per(params[:per_page] || 10)

    render json: {
      courses: courses.as_json(
        include: {
          course_category: { only: [:id, :name, :code] }
        },
        methods: [:average_rating]
      ),
      meta: pagination_meta(courses)
    }, status: :ok
  end

  def show
    @course = Course.find(params[:id])
    authorize @course
    render json: @course.as_json(
      include: {
        course_category: { only: [:id, :name, :code] },
        course_sessions: {
          include: {
            teacher: {
              include: {
                user: { only: [:id, :name, :avatar_url] }
              },
              only: [:id, :specialties, :status]
            }
          },
          only: [:id, :start_time, :end_time, :location, :status, :registered_count]
        }
      },
      methods: [:average_rating]
    ), status: :ok
  end

  def calendar
    start_date = params[:start_date] ? Date.parse(params[:start_date]) : Date.today
    end_date = params[:end_date] ? Date.parse(params[:end_date]) : start_date + 1.month

    sessions = CourseSession.scheduled.in_date_range(start_date, end_date)
    sessions = sessions.by_teacher(params[:teacher_id]) if params[:teacher_id].present?

    render json: sessions.as_json(
      include: {
        course: { only: [:id, :title, :cover_url, :difficulty_level] },
        teacher: {
          include: { user: { only: [:name] } },
          only: [:id]
        }
      },
      only: [:id, :start_time, :end_time, :location, :registered_count]
    ), status: :ok
  end

  def create
    authorize Course
    @course = Course.new(course_params)
    if @course.save
      render json: @course, status: :created
    else
      render json: { error: @course.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    @course = Course.find(params[:id])
    authorize @course
    if @course.update(course_params)
      render json: @course, status: :ok
    else
      render json: { error: @course.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def course_params
    params.permit(
      :title,
      :description,
      :content,
      :cover_url,
      :course_category_id,
      :duration_minutes,
      :price,
      :material_fee,
      :difficulty_level,
      :min_students,
      :max_students,
      :requires_approval,
      :is_published,
      gallery_urls: [],
      tags: []
    )
  end

  def pagination_meta(collection)
    {
      current_page: collection.current_page,
      total_pages: collection.total_pages,
      total_count: collection.total_count,
      per_page: collection.limit_value
    }
  end
end
