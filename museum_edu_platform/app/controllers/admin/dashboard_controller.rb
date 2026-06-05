module Admin
  class DashboardController < BaseController
    def index
      @today_sessions = Session.today
      @pending_registrations = Registration.pending_approval
      @upcoming_sessions = Session.upcoming.limit(5)
      @active_courses_count = Course.published.count
      @total_students = Student.active_students.count
      @active_guides_count = User.active_guides.count
    end
  end
end
