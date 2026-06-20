class LeaveRequestsController < ApplicationController
  before_action :set_leave_request, only: [:show]
  before_action :set_enrollment, only: [:new, :create]

  def index
    @q = policy_scope(LeaveRequest).ransack(params[:q])
    @leave_requests = @q.result.includes(:user, :course_enrollment).order(created_at: :desc).page(params[:page]).per(20)
  end

  def show
    authorize @leave_request
    @versions = @leave_request.versions.reorder(created_at: :desc).limit(10)
  end

  def new
    @leave_request = @enrollment.leave_requests.new
    authorize @leave_request
  end

  def create
    @leave_request = @enrollment.leave_requests.new(leave_request_params)
    @leave_request.user = current_user
    authorize @leave_request

    if @leave_request.save
      redirect_to @leave_request, notice: "请假申请已提交。"
    else
      render :new
    end
  end

  private

  def set_leave_request
    @leave_request = LeaveRequest.find(params[:id])
  end

  def set_enrollment
    @enrollment = CourseEnrollment.find(params[:course_enrollment_id])
  end

  def leave_request_params
    params.require(:leave_request).permit(:leave_date, :reason, :remark)
  end
end
