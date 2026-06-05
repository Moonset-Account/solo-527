class CoursesController < ApplicationController
  skip_before_action :authenticate_user!, only: [:index, :show]

  def index
    @courses = Course.published.includes(:sessions)
    @courses = @courses.by_category(params[:category]) if params[:category].present?
    @courses = @courses.for_age(params[:age].to_i) if params[:age].present?
    @courses = @courses.order(:title)
  end

  def show
    @course = Course.friendly.find(params[:id])
    @upcoming_sessions = @course.sessions.upcoming.order(:start_at)
  end
end
