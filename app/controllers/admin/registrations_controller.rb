class Admin::RegistrationsController < ApplicationController
  before_action :require_login
  before_action :require_admin

  def index
    @registrations = Registration.includes(:event, :user, :schedule).recent
    @registrations = @registrations.where(status: params[:status]) if params[:status].present?
    @registrations = @registrations.where(event_id: params[:event_id]) if params[:event_id].present?
    @saved_filters = SavedFilterService.new(current_user).list(filterable_type: "Registration")
  end

  def update
    @registration = Registration.find(params[:id])
    @registration.update(registration_params)
    redirect_to admin_registrations_path, notice: "报名已更新"
  end

  def approve
    @registration = Registration.find(params[:id])
    @registration.update!(status: :approved, reviewed_at: Time.current)
    AuditLogService.new.log(action: "registration_approved", auditable: @registration, user: current_user)
    redirect_to admin_registrations_path, notice: "报名已通过"
  end

  def reject
    @registration = Registration.find(params[:id])
    @registration.update!(status: :rejected, reviewed_at: Time.current)
    AuditLogService.new.log(action: "registration_rejected", auditable: @registration, user: current_user)
    redirect_to admin_registrations_path, notice: "报名已拒绝"
  end

  def batch_approve
    ids = params[:registration_ids] || []
    service = BatchOperationService.new(current_user)
    @batch_op = service.execute(operation_type: "approve", target_type: "Registration", target_ids: ids)
    redirect_to admin_batch_operation_path(@batch_op), notice: "批量审核已提交"
  end

  private

  def registration_params
    params.require(:registration).permit(:status, :note)
  end
end
