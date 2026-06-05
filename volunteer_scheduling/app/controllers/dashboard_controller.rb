class DashboardController < ApplicationController
  def index
    if current_user.volunteer?
      @volunteer_profile = current_user.volunteer_profile
      @upcoming_assignments = @volunteer_profile.assignments.accepted.includes(:activity).where("activities.start_time >= ?", Date.today).references(:activity).order("activities.start_time ASC").limit(5)
      @recent_check_ins = @volunteer_profile.check_ins.includes(:activity).order(created_at: :desc).limit(5)
      @total_hours = @volunteer_profile.total_service_hours
      @notifications = current_user.notifications.unread.order(created_at: :desc).limit(10)
    elsif current_user.project_manager?
      @my_activities = current_user.project_manager_activities.includes(:locations).order(created_at: :desc).limit(10)
      @pending_assignments = Assignment.joins(:activity).where(activities: { project_manager_id: current_user.id }).where(status: :pending).count
      @check_ins_to_review = CheckIn.joins(assignment: :activity).where(activities: { project_manager_id: current_user.id }).where(status: [:needs_review, :checked_out]).count
    elsif current_user.admin?
      @total_users = User.count
      @total_activities = Activity.count
      @total_volunteers = VolunteerProfile.count
      @check_ins_pending_review = CheckIn.where(status: :needs_review).count
      @recent_activities = Activity.order(created_at: :desc).limit(5)
    end
  end
end
