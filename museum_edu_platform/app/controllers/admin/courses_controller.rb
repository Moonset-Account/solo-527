module Admin
  class CoursesController < BaseController
    before_action :set_course, only: [:show, :edit, :update, :destroy]

    def index
      @courses = policy_scope(Course).order(created_at: :desc)
      @courses = @courses.by_category(params[:category]) if params[:category].present?
    end

    def show
    end

    def new
      @course = Course.new
      authorize @course
    end

    def edit
    end

    def create
      @course = Course.new(course_params)
      authorize @course

      if @course.save
        redirect_to admin_course_path(@course), notice: '课程创建成功'
      else
        render :new
      end
    end

    def update
      if @course.update(course_params)
        redirect_to admin_course_path(@course), notice: '课程更新成功'
      else
        render :edit
      end
    end

    def destroy
      @course.destroy
      redirect_to admin_courses_path, notice: '课程已删除'
    end

    private

    def set_course
      @course = Course.friendly.find(params[:id])
      authorize @course
    end

    def course_params
      params.require(:course).permit(:title, :description, :age_min, :age_max, 
                                      :duration_minutes, :capacity, :status, :category, :cover_image)
    end
  end
end
