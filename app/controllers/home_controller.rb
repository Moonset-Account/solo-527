class HomeController < ApplicationController
  skip_before_action :authenticate_user!, only: [:index]

  def index
    if user_signed_in?
      @my_courses = current_user.courses.active.limit(5)
      @my_events = current_user.events.upcoming.limit(5)
      @recent_check_ins = current_user.check_ins.recent.limit(5)
    else
      @featured_courses = Course.active.with_available_spots.limit(6)
      @upcoming_events = Event.registration_open.limit(6)
    end
  end
end
