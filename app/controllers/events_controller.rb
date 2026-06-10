class EventsController < ApplicationController
  before_action :require_login

  def index
    @events = Event.published.recent
    @events = @events.where("title ILIKE ?", "%#{params[:q]}%") if params[:q].present?
  end

  def show
    @event = Event.find(params[:id])
    @ticket_types = @event.ticket_types.active
  end
end
