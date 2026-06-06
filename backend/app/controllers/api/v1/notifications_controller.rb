class Api::V1::NotificationsController < Api::V1::BaseController
  def index
    notifications = current_user.notifications.recent
    notifications = notifications.unread if params[:unread].present?
    notifications = notifications.page(params[:page]).per(params[:per_page] || 20)

    render json: {
      notifications: notifications,
      meta: {
        unread_count: current_user.notifications.unread.count,
        current_page: notifications.current_page,
        total_pages: notifications.total_pages,
        total_count: notifications.total_count
      }
    }, status: :ok
  end

  def show
    @notification = current_user.notifications.find(params[:id])
    @notification.mark_as_read!
    render json: @notification, status: :ok
  end

  def mark_all_read
    Notification.mark_all_as_read!(current_user.id)
    render json: { message: '已全部标记为已读' }, status: :ok
  end

  def unread_count
    render json: { count: current_user.notifications.unread.count }, status: :ok
  end

  def mark_read
    @notification = current_user.notifications.find(params[:id])
    @notification.mark_as_read!
    render json: @notification, status: :ok
  end

  def export
    notifications = current_user.notifications.recent
    columns = [
      { label: '标题', value: :title },
      { label: '内容', value: :content },
      { label: '类型', value: :notification_type },
      { label: '状态', value: ->(n) { n.read? ? '已读' : '未读' } },
      { label: '创建时间', value: ->(n) { n.created_at.strftime('%Y-%m-%d %H:%M:%S') } }
    ]
    export_to_csv(notifications, '通知记录', columns)
  end
end
