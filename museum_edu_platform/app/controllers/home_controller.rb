class HomeController < ApplicationController
  skip_before_action :authenticate_user!, only: [:index]

  def index
    @courses = Course.published.order(:title)
    @upcoming_sessions = Session.upcoming.limit(5)
  end
end
