class TrackingReminderNotificationJob < ApplicationJob
  queue_as :default

  def perform
    TrackingReminder.where(status: 'pending').where('reminder_date <= ?', Date.today).find_each do |reminder|
      reminder.mark_sent!
      Rails.logger.info("Notification sent: #{reminder.message}")
    end
  end
end
