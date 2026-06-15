module Admin
  class NotificationsController < ApplicationController
    def index
      scope = Notification.order(created_at: :desc)
      @pagy, @notifications = pagy(scope, page: params[:page], items: 30)
    end

    def show
      @notification = Notification.find(params[:id])
      @notification.mark_as_read!
    end

    def mark_as_read
      @notification = Notification.find(params[:id])
      @notification.mark_as_read!
      redirect_back(fallback_location: admin_notifications_path)
    end

    def mark_all_as_read
      Notification.unread.update_all(is_read: true, read_at: Time.current)
      redirect_back(fallback_location: admin_notifications_path, notice: "所有通知已标记为已读。")
    end

    def destroy
      @notification = Notification.find(params[:id])
      @notification.destroy
      redirect_to admin_notifications_url, notice: "通知已删除。"
    end
  end
end
