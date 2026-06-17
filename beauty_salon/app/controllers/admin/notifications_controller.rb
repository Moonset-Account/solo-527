class Admin::NotificationsController < ApplicationController
  layout "admin"

  def index
    @notifications = Notification.recent
    @notifications = @notifications.by_category(params[:category]) if params[:category].present?
    @notifications = @notifications.where(read: false) if params[:unread] == "true"
  end

  def show
    @notification = Notification.find(params[:id])
    @notification.mark_as_read!
  end

  def mark_all_read
    Notification.unread.update_all(read: true)
    redirect_to admin_notifications_path, notice: "已全部标记为已读"
  end
end
