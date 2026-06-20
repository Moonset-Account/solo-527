module Admin
  class VenueBookingsController < BaseController
    before_action :set_booking, only: [:show, :edit, :update, :destroy, :cancel]

    def index
      @q = VenueBooking.ransack(params[:q])
      @bookings = @q.result.includes(:venue, :user).order(start_time: :desc).page(params[:page]).per(20)
    end

    def show
      @versions = @booking.versions.reorder(created_at: :desc).limit(20)
    end

    def new
      @booking = VenueBooking.new
    end

    def create
      @booking = VenueBooking.new(booking_params)
      @booking.status = "confirmed"

      if @booking.save
        redirect_to [:admin, @booking], notice: "预约创建成功。"
      else
        render :new
      end
    end

    def edit
    end

    def update
      if @booking.update(booking_params)
        redirect_to [:admin, @booking], notice: "预约更新成功。"
      else
        render :edit
      end
    end

    def destroy
      @booking.destroy
      redirect_to admin_venue_bookings_path, notice: "预约已删除。"
    end

    def cancel
      @booking.cancel!
      redirect_to [:admin, @booking], notice: "预约已取消。"
    end

    private

    def set_booking
      @booking = VenueBooking.find(params[:id])
    end

    def booking_params
      params.require(:venue_booking).permit(:venue_id, :user_id, :start_time, :end_time,
        :purpose, :status, :remark)
    end
  end
end
