class EventRegistrationsController < ApplicationController
  before_action :set_registration, only: [:show, :cancel]

  def index
    @q = policy_scope(EventRegistration).ransack(params[:q])
    @registrations = @q.result.includes(:event, :user).order(created_at: :desc).page(params[:page]).per(20)
  end

  def show
    authorize @registration
    @payments = @registration.payments.order(created_at: :desc)
    @results = @registration.results.order(created_at: :desc)
    @versions = @registration.versions.reorder(created_at: :desc).limit(10)
  end

  def cancel
    authorize @registration
    @registration.cancel!
    redirect_to event_registrations_path, notice: "已取消赛事报名。"
  end

  private

  def set_registration
    @registration = EventRegistration.find(params[:id])
  end
end
