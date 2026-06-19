class DashboardController < ApplicationController
  def index
    @total_shifts = Shift.count
    @active_enrollments = ShiftEnrollment.where(status: "enrolled").count
    @pending_donations = Donation.where(status: "pending").count
    @overdue_visits = VisitRecord.where(status: "overdue").count
    @upcoming_reminders = TrackingReminder.where(status: "pending").order(reminder_date: :asc).limit(5)
  end
end
