module Admin
  class DashboardController < BaseController
    def index
      @total_courses = Course.count
      @total_enrollments = CourseEnrollment.confirmed.count
      @total_events = Event.count
      @total_users = User.member.count
      @today_check_ins = CheckIn.today.checked_in.count
      @pending_payments = Payment.pending.count
      @failed_payments = Payment.failed.count
      @pending_leaves = LeaveRequest.pending.count

      @recent_enrollments = CourseEnrollment.recent.includes(:user, :course).limit(5)
      @recent_payments = Payment.recent.includes(:user).limit(5)
      @recent_batch_jobs = BatchJob.recent.limit(5)

      @courses_with_low_fill = Course.active.where("enrolled_count < capacity * 0.5")
        .order("enrolled_count::float / NULLIF(capacity, 0) ASC")
        .limit(5)
    end
  end
end
