class NotificationsController < ApplicationController
  before_action :set_notification, only: [:show, :mark_as_read]

  def index
    @notifications = current_user.notifications.order(created_at: :desc).page(params[:page]).per(20)
  end

  def show
    @notification.mark_as_read! unless @notification.read?
  end

  def mark_as_read
    @notification.mark_as_read!
    redirect_back(fallback_location: notifications_path, notice: "已标记为已读。")
  end

  def mark_all_as_read
    current_user.notifications.unread.update_all(read: true, read_at: Time.current)
    redirect_to notifications_path, notice: "所有通知已标记为已读。"
  end

  private

  def set_notification
    @notification = current_user.notifications.find(params[:id])
  end
end
