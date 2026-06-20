class CoursesController < ApplicationController
  before_action :set_course, only: [:show, :enroll]

  def index
    @q = policy_scope(Course).ransack(params[:q])
    @courses = @q.result.page(params[:page]).per(12)
  end

  def show
    authorize @course
    @my_enrollment = current_user.course_enrollments.find_by(course: @course) if user_signed_in?
  end

  def enroll
    authorize @course, :enroll?

    if @course.enroll_user(current_user, source: "web")
      enrollment = current_user.course_enrollments.find_by(course: @course)
      if enrollment
        redirect_to course_enrollment_path(enrollment), notice: "报名成功！请完成支付。"
      else
        redirect_to @course, notice: "报名成功！"
      end
    else
      redirect_to @course, alert: "报名失败：#{@course.errors.full_messages.join(', ')}"
    end
  end

  private

  def set_course
    @course = Course.find(params[:id])
  end
end
