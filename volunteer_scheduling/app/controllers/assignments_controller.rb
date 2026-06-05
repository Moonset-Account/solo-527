class AssignmentsController < ApplicationController
  before_action :set_assignment, only: [:show, :update, :destroy, :accept, :decline, :swap]

  def index
    if params[:activity_id]
      @activity = Activity.find(params[:activity_id])
      @assignments = @activity.assignments
      authorize @assignments
    else
      @assignments = policy_scope(Assignment).includes(:activity, :volunteer_profile, :location).order(created_at: :desc)
      authorize @assignments
    end
  end

  def show
    authorize @assignment
  end

  def new
    @activity = Activity.find(params[:activity_id])
    @assignment = @activity.assignments.new
    authorize @assignment
    @recommended_volunteers = @activity.recommended_volunteers.limit(10)
  end

  def create
    @activity = Activity.find(params[:activity_id])
    @assignment = @activity.assignments.new(assignment_params)
    @assignment.location ||= @activity.locations.first
    authorize @assignment

    if @assignment.save
      redirect_to activity_assignment_path(@activity, @assignment), notice: "排班创建成功。"
    else
      @recommended_volunteers = @activity.recommended_volunteers.limit(10)
      render :new
    end
  end

  def update
    authorize @assignment
    if @assignment.update(assignment_params)
      redirect_to @assignment, notice: "排班更新成功。"
    else
      render :edit
    end
  end

  def destroy
    authorize @assignment
    @assignment.destroy
    redirect_to assignments_url, notice: "排班已取消。"
  end

  def accept
    authorize @assignment, :accept?
    if @assignment.pending?
      @assignment.accepted!
      @assignment.update!(accepted_at: Time.current)
      redirect_to @assignment, notice: "已确认参加活动。"
    else
      redirect_to @assignment, alert: "无法接受此排班。"
    end
  end

  def decline
    authorize @assignment, :decline?
    if @assignment.pending?
      @assignment.declined!
      @assignment.update!(declined_at: Time.current, decline_reason: params[:decline_reason])
      redirect_to @assignment, notice: "已拒绝参加活动。"
    else
      redirect_to @assignment, alert: "无法拒绝此排班。"
    end
  end

  def swap
    authorize @assignment, :swap?
    new_volunteer = VolunteerProfile.find(params[:new_volunteer_id])
    change_reason = params[:change_reason]

    if @assignment.swap!(new_volunteer, current_user, change_reason)
      redirect_to @assignment, notice: "志愿者调换成功。"
    else
      redirect_to @assignment, alert: "志愿者调换失败。"
    end
  end

  def recommendations
    @activity = Activity.find(params[:activity_id])
    authorize @activity, :assign_volunteers?
    @recommended_volunteers = @activity.recommended_volunteers.limit(20)
  end

  private

  def set_assignment
    @assignment = Assignment.find(params[:id])
  end

  def assignment_params
    params.require(:assignment).permit(:volunteer_profile_id, :location_id, :status)
  end
end
