class EventsController < ApplicationController
  before_action :set_event, only: [:show, :register]

  def index
    @q = policy_scope(Event).ransack(params[:q])
    @events = @q.result.order(start_date: :desc).page(params[:page]).per(12)
  end

  def show
    authorize @event
    @my_registration = current_user.event_registrations.find_by(event: @event) if user_signed_in?
    @schedules = @event.schedules.ordered
  end

  def register
    authorize @event, :register?

    registration = @event.register_user(current_user, source: "web")
    if registration.persisted?
      redirect_to event_registration_path(registration), notice: "报名成功！请完成支付。"
    else
      redirect_to @event, alert: "报名失败：#{registration.errors.full_messages.join(', ')}"
    end
  end

  private

  def set_event
    @event = Event.find(params[:id])
  end
end
