module Admin
  class NotificationsController < ApplicationController
    include ActionView::RecordIdentifier

    def index
      scope = Notification.order(created_at: :desc)
      @pagy, @notifications = pagy(scope, page: params[:page], items: 30)
    end

    def show
      @notification = Notification.find(params[:id])
      @notification.mark_as_read! unless @notification.is_read?
    end

    def mark_as_read
      @notification = Notification.find(params[:id])
      @notification.mark_as_read!
      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: [
            turbo_stream.replace(dom_id(@notification), partial: "admin/notifications/notification_item", locals: { notification: @notification.reload }),
            turbo_stream.replace("unread-count", partial: "admin/notifications/unread_badge")
          ]
        end
        format.html { redirect_back(fallback_location: admin_notifications_path) }
      end
    end

    def mark_all_as_read
      unread_notifications = Notification.unread.to_a
      unread_notifications.each do |notification|
        notification.mark_as_read!
      end
      redirect_back(fallback_location: admin_notifications_path, notice: "所有通知已标记为已读。")
    end

    def destroy
      @notification = Notification.find(params[:id])
      @notification.destroy
      redirect_to admin_notifications_url, notice: "通知已删除。"
    end
  end
end
