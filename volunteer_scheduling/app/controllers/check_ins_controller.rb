class CheckInsController < ApplicationController
  before_action :set_check_in, only: [:show, :check_out, :approve, :reject]

  def index
    @check_ins = policy_scope(CheckIn).includes(assignment: [:activity, :volunteer_profile]).order(created_at: :desc)
    authorize @check_ins
  end

  def show
    authorize @check_in
  end

  def new
    @assignment = Assignment.find(params[:assignment_id])
    @check_in = @assignment.check_ins.new
    authorize @check_in
  end

  def create
    @assignment = Assignment.find(params[:assignment_id])
    authorize @assignment.check_ins.new

    method = params[:check_in_method] || "qr_code"
    latitude = params[:latitude]
    longitude = params[:longitude]

    begin
      @check_in = CheckIn.check_in(@assignment, method, latitude, longitude)
      if @check_in.needs_review?
        redirect_to @check_in, alert: "签到成功，但需要人工复核：#{@check_in.review_reason}"
      else
        redirect_to @check_in, notice: "签到成功。"
      end
    rescue => e
      redirect_to @assignment, alert: "签到失败：#{e.message}"
    end
  end

  def check_out
    authorize @check_in, :check_out?
    if @check_in.checked_in?
      @check_in.check_out!
      if @check_in.needs_review?
        redirect_to @check_in, alert: "签退成功，但需要人工复核：#{@check_in.review_reason}"
      else
        redirect_to @check_in, notice: "签退成功，本次服务时长 #{@check_in.service_hours} 小时。"
      end
    else
      redirect_to @check_in, alert: "无法签退。"
    end
  end

  def approve
    authorize @check_in, :approve?
    begin
      if @check_in.requires_two_admins?
        @check_in.approve_by_admin!(current_user, params[:notes])
        if @check_in.approved?
          redirect_to @check_in, notice: "已通过审核，服务时长已计入。"
        else
          redirect_to @check_in, notice: "已确认，还需要另一名管理员确认。"
        end
      else
        @check_in.approve_by_admin!(current_user, params[:notes])
        redirect_to @check_in, notice: "已通过审核，服务时长已计入。"
      end
    rescue => e
      redirect_to @check_in, alert: e.message
    end
  end

  def reject
    authorize @check_in, :reject?
    reason = params[:reason] || "审核未通过"
    @check_in.reject_by_admin!(current_user, reason)
    redirect_to @check_in, notice: "已拒绝此次签到。"
  end

  private

  def set_check_in
    @check_in = CheckIn.find(params[:id])
  end
end
