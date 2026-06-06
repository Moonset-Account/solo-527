class SessionReminderJob < ApplicationJob
  queue_as :reminders

  def perform(course_session_id)
    session = CourseSession.find_by(id: course_session_id)
    return unless session

    session.bookings.confirmed.each do |booking|
      Rails.logger.info "Would send reminder to #{booking.contact_phone} for session ##{session.id}"
    end
  end
end
