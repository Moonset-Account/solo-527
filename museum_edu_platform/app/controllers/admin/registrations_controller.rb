module Admin
  class RegistrationsController < BaseController
    before_action :set_registration, only: [:show, :approve, :reject, :cancel]

    def index
      @registrations = policy_scope(Registration).includes(:session, :school, :user)
        .order(created_at: :desc)
      @registrations = @registrations.by_status(params[:status]) if params[:status].present?
      @registrations = @registrations.by_session(params[:session_id]) if params[:session_id].present?
    end

    def show
    end

    def approve
      authorize @registration, :approve?

      if @registration.approve!(current_user)
        redirect_to admin_registration_path(@registration), notice: '报名已通过'
      else
        redirect_to admin_registration_path(@registration), alert: "审核失败：#{@registration.errors.full_messages.join(', ')}"
      end
    end

    def reject
      authorize @registration, :reject?
      reason = params[:rejection_reason]

      if reason.blank?
        redirect_to admin_registration_path(@registration), alert: '请填写拒绝原因'
        return
      end

      if @registration.reject!(reason, current_user)
        redirect_to admin_registration_path(@registration), notice: '报名已拒绝'
      else
        redirect_to admin_registration_path(@registration), alert: '操作失败'
      end
    end

    def cancel
      authorize @registration, :cancel?

      if @registration.cancel!
        redirect_to admin_registration_path(@registration), notice: '报名已取消'
      else
        redirect_to admin_registration_path(@registration), alert: '操作失败'
      end
    end

    private

    def set_registration
      @registration = Registration.find(params[:id])
      authorize @registration
    end
  end
end
