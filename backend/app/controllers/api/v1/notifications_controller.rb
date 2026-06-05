module Api
  module V1
    class NotificationsController < ApplicationController
      def index
        scope = current_user.notifications
        scope = scope.unread if params[:unread].present? && params[:unread] == 'true'
        scope = scope.recent
        render_paginated(scope)
      end

      def unread_count
        count = current_user.notifications.unread.count
        render json: { count: count }
      end

      def mark_as_read
        notification = current_user.notifications.find(params[:id])
        notification.mark_as_read!
        render json: { message: '已标记为已读' }
      end

      def mark_all_as_read
        Notification.mark_all_as_read!(current_user.id)
        render json: { message: '全部标记为已读' }
      end
    end
  end
end
