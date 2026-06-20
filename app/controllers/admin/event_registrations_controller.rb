module Admin
  class EventRegistrationsController < BaseController
    before_action :set_registration, only: [:show, :confirm, :cancel]

    def index
      @q = EventRegistration.ransack(params[:q])
      @registrations = @q.result.includes(:user, :event).order(created_at: :desc).page(params[:page]).per(20)
    end

    def show
      @versions = @registration.versions.reorder(created_at: :desc).limit(20)
      @results = @registration.results.includes(:schedule)
    end

    def confirm
      @registration.confirm!
      redirect_to [:admin, @registration], notice: "报名已确认。"
    end

    def cancel
      @registration.cancel!
      redirect_to [:admin, @registration], notice: "报名已取消。"
    end

    private

    def set_registration
      @registration = EventRegistration.find(params[:id])
    end
  end
end
