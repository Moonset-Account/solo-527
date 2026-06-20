class VenuesController < ApplicationController
  def index
    @venues = policy_scope(Venue).active.page(params[:page]).per(12)
  end

  def show
    @venue = Venue.find(params[:id])
    authorize @venue
    @upcoming_bookings = @venue.venue_bookings.upcoming.confirmed.order(start_time: :asc).limit(10)
  end
end
