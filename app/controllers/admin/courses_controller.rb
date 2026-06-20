module Admin
  class CoursesController < BaseController
    before_action :set_course, only: [:show, :edit, :update, :destroy, :activate, :deactivate, :export_enrollments]

    def index
      @q = Course.ransack(params[:q])
      @courses = @q.result.page(params[:page]).per(20)
      @total_courses = Course.count
      @active_courses = Course.active.count
      @avg_fill_rate = Course.active.where("capacity > 0").average("enrolled_count::float / NULLIF(capacity, 0) * 100").to_f.round(2)
      @total_enrollments = Course.sum(:enrolled_count)
    end

    def show
      @course_enrollments = @course.course_enrollments.includes(:user).order(created_at: :desc).limit(20)
      @versions = @course.versions.reorder(created_at: :desc).limit(10)
    end

    def new
      @course = Course.new
      authorize @course
    end

    def create
      @course = Course.new(course_params)
      authorize @course

      if @course.save
        redirect_to [:admin, @course], notice: "课程创建成功。"
      else
        render :new
      end
    end

    def edit
      authorize @course
    end

    def update
      authorize @course
      if @course.update(course_params)
        redirect_to [:admin, @course], notice: "课程更新成功。"
      else
        render :edit
      end
    end

    def destroy
      authorize @course
      @course.destroy
      redirect_to admin_courses_path, notice: "课程已删除。"
    end

    def activate
      authorize @course
      @course.update!(status: "active")
      redirect_to [:admin, @course], notice: "课程已上架。"
    end

    def deactivate
      authorize @course
      @course.update!(status: "cancelled")
      redirect_to [:admin, @course], notice: "课程已下架。"
    end

    def export
      authorize Course, :export?

      batch_job = BatchJob.create!(
        job_type: "export_data",
        user: current_user,
        status: "pending"
      )

      jid = DataExportJob.perform_async("courses", params.to_unsafe_h.slice(:q))
      batch_job.update!(sidekiq_jid: jid)

      redirect_to admin_batch_job_path(batch_job), notice: "导出任务已提交，请稍候查看结果。"
    end

    def export_enrollments
      authorize @course, :export?

      batch_job = BatchJob.create!(
        job_type: "export_data",
        user: current_user,
        status: "pending"
      )

      jid = DataExportJob.perform_async("course_enrollments", { course_id: @course.id })
      batch_job.update!(sidekiq_jid: jid)

      redirect_to admin_batch_job_path(batch_job), notice: "导出任务已提交，请稍候查看结果。"
    end

    private

    def set_course
      @course = Course.find(params[:id])
    end

    def course_params
      params.require(:course).permit(:name, :description, :capacity, :price, :level,
        :coach, :start_date, :end_date, :schedule_info, :status, :venue_id)
    end
  end
end
