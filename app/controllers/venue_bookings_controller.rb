class VenueBookingsController < ApplicationController
  before_action :set_booking, only: [:show, :cancel, :destroy]

  def index
    @q = policy_scope(VenueBooking).ransack(params[:q])
    @bookings = @q.result.includes(:venue, :user).order(start_time: :desc).page(params[:page]).per(20)
  end

  def show
    authorize @booking
    @versions = @booking.versions.reorder(created_at: :desc).limit(10)
  end

  def new
    @venue = Venue.find(params[:venue_id]) if params[:venue_id]
    @booking = VenueBooking.new
    @booking.venue = @venue if @venue
    authorize @booking
  end

  def create
    @booking = VenueBooking.new(booking_params)
    @booking.user = current_user
    @booking.status = "confirmed"
    authorize @booking

    if @booking.save
      redirect_to @booking, notice: "场地预约成功！"
    else
      render :new
    end
  end

  def cancel
    authorize @booking
    @booking.cancel!
    redirect_to venue_bookings_path, notice: "预约已取消。"
  end

  def destroy
    authorize @booking
    @booking.cancel!
    redirect_to venue_bookings_path, notice: "预约已取消。"
  end

  private

  def set_booking
    @booking = VenueBooking.find(params[:id])
  end

  def booking_params
    params.require(:venue_booking).permit(:venue_id, :start_time, :end_time, :purpose, :remark)
  end
end
