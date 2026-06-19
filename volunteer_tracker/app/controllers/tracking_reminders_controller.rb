class TrackingRemindersController < ApplicationController
  before_action :set_tracking_reminder, only: [:mark_sent, :dismiss]

  def index
    @tracking_reminders = TrackingReminder.where(status: "pending").order(reminder_date: :asc)
    @grouped = @tracking_reminders.group_by(&:trackable_type)
  end

  def mark_sent
    @tracking_reminder.mark_sent!
    redirect_to tracking_reminders_url, notice: "Reminder marked as sent."
  end

  def dismiss
    @tracking_reminder.dismiss!
    redirect_to tracking_reminders_url, notice: "Reminder dismissed."
  end

  private

  def set_tracking_reminder
    @tracking_reminder = TrackingReminder.find(params[:id])
  end
end
