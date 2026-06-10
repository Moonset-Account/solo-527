class Admin::RevenueController < ApplicationController
  before_action :require_login
  before_action :require_admin

  def index
    @events = Event.published.recent
    @selected_event = params[:event_id].present? ? Event.find(params[:event_id]) : @events.first
    if @selected_event
      service = RevenueService.new
      @revenue_summary = service.event_revenue(@selected_event)
      @refund_rate = service.refund_rate(@selected_event)
      @daily_revenue = service.daily_revenue(@selected_event)
      @revenue_by_type = service.revenue_by_ticket_type(@selected_event)
    end
    @anomalies = RevenueAnomaly.where(event: @selected_event).recent.limit(20)
  end
end
