class Admin::DashboardController < ApplicationController
  layout "admin"

  def index
    @today_appointments = Appointment.today.includes(:customer, :technician, :treatment)
    @pending_todos = TodoItem.pending_only.limit(10)
    @unread_notifications = Notification.unread.limit(10)
    @active_cards = TreatmentCard.active_only.count
    @expiring_cards = TreatmentCard.expiring_soon.count
  end
end
