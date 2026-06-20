class CourseEnrollmentsController < ApplicationController
  before_action :set_enrollment, only: [:show, :cancel, :destroy]

  def index
    @q = policy_scope(CourseEnrollment).ransack(params[:q])
    @enrollments = @q.result.includes(:course, :user).order(created_at: :desc).page(params[:page]).per(20)
  end

  def show
    authorize @enrollment
    @leave_requests = @enrollment.leave_requests.order(created_at: :desc).limit(5)
    @payments = @enrollment.payments.order(created_at: :desc)
    @check_ins = @enrollment.check_ins.order(created_at: :desc).limit(10)
    @versions = @enrollment.versions.reorder(created_at: :desc).limit(10)
  end

  def create
    @course = Course.find(params[:course_id])
    authorize @course, :enroll?

    if @course.enroll_user(current_user, source: "web")
      @enrollment = current_user.course_enrollments.find_by(course: @course)
      redirect_to course_enrollment_path(@enrollment), notice: "报名成功！"
    else
      redirect_to @course, alert: "报名失败。"
    end
  end

  def cancel
    authorize @enrollment
    @enrollment.cancel!
    redirect_to course_enrollments_path, notice: "已取消报名。"
  end

  def destroy
    authorize @enrollment
    @enrollment.cancel!
    redirect_to course_enrollments_path, notice: "已取消报名。"
  end

  private

  def set_enrollment
    @enrollment = CourseEnrollment.find(params[:id])
  end
end
