class NotificationsChannel < ApplicationCable::Channel
  def subscribed
    stream_from "notifications"
    stream_from "dashboard_updates"
  end

  def unsubscribed
  end
end
