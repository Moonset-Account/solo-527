class SessionReminderJob < ApplicationJob
  queue_as :default

  def perform
    Rails.logger.info "开始发送活动提醒..."

    sessions = Session.where(start_at: 24.hours.from_now..48.hours.from_now)
                      .where(status: [:open, :scheduled])

    sessions.each do |session|
      send_session_reminders(session)
    end

    Rails.logger.info "活动提醒发送完成，共处理 #{sessions.count} 个场次"
  end

  private

  def send_session_reminders(session)
    registrations = session.registrations.approved.includes(:user)

    registrations.each do |registration|
      next if registration.user.blank?

      create_notification(registration, session)
    end
  end

  def create_notification(registration, session)
    Notification.find_or_create_by!(
      user: registration.user,
      related_object: registration,
      notification_type: 'session_reminder',
      title: '活动明天开始',
      content: "您报名的#{session.course.title}课程将于明天#{session.start_at.strftime('%H:%M')}在#{session.location}开始，请准时参加。"
    )
  end
end
