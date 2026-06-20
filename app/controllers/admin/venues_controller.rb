module Admin
  class VenuesController < BaseController
    before_action :set_venue, only: [:show, :edit, :update, :destroy]

    def index
      @q = Venue.ransack(params[:q])
      @venues = @q.result.page(params[:page]).per(20)
    end

    def show
      @bookings = @venue.venue_bookings.upcoming.includes(:user).order(start_time: :asc).limit(20)
      @versions = @venue.versions.reorder(created_at: :desc).limit(10)
    end

    def new
      @venue = Venue.new
    end

    def create
      @venue = Venue.new(venue_params)
      if @venue.save
        redirect_to [:admin, @venue], notice: "场地创建成功。"
      else
        render :new
      end
    end

    def edit
    end

    def update
      if @venue.update(venue_params)
        redirect_to [:admin, @venue], notice: "场地更新成功。"
      else
        render :edit
      end
    end

    def destroy
      @venue.destroy
      redirect_to admin_venues_path, notice: "场地已删除。"
    end

    private

    def set_venue
      @venue = Venue.find(params[:id])
    end

    def venue_params
      params.require(:venue).permit(:name, :location, :capacity, :facilities, :status, :description)
    end
  end
end
