module Admin
  class LeaveRequestsController < BaseController
    before_action :set_leave_request, only: [:show, :approve, :reject]

    def index
      @q = LeaveRequest.ransack(params[:q])
      @leave_requests = @q.result.includes(:user, :course_enrollment).order(created_at: :desc).page(params[:page]).per(20)
    end

    def show
      @versions = @leave_request.versions.reorder(created_at: :desc).limit(20)
    end

    def approve
      @leave_request.approve!(current_user)
      redirect_to [:admin, @leave_request], notice: "请假已批准。"
    end

    def reject
      @leave_request.reject!(current_user, params[:note])
      redirect_to [:admin, @leave_request], notice: "请假已驳回。"
    end

    private

    def set_leave_request
      @leave_request = LeaveRequest.find(params[:id])
    end
  end
end
