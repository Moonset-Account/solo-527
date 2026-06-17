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

  def download_export
    @notification = Notification.find(params[:id])
    if @notification.export_file.attached?
      send_data @notification.export_file.download,
        filename: @notification.export_file.filename.to_s,
        content_type: "text/csv",
        disposition: "attachment"
    else
      redirect_to admin_notifications_path, alert: "导出文件不存在"
    end
  end
end
