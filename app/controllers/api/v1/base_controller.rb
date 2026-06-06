module Api
  module V1
    class BaseController < ApplicationController
      include Pundit::Authorization

      before_action :authenticate_user!
      before_action :configure_permitted_parameters, if: :devise_controller?

      rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
      rescue_from ActiveRecord::RecordNotFound, with: :record_not_found

      protected

      def configure_permitted_parameters
        devise_parameter_sanitizer.permit(:sign_up, keys: %i[name phone role])
        devise_parameter_sanitizer.permit(:account_update, keys: %i[name phone])
      end

      def current_user
        @current_user ||= warden.authenticate(scope: :user)
      end

      private

      def user_not_authorized
        render json: { error: '没有权限执行此操作' }, status: :forbidden
      end

      def record_not_found
        render json: { error: '记录不存在' }, status: :not_found
      end

      def decorate_collection(collection, decorator_class)
        decorator_class.decorate_collection(collection, context: { current_user: current_user })
      end

      def decorate_resource(resource, decorator_class)
        decorator_class.decorate(resource, context: { current_user: current_user })
      end

      def render_paginated(collection, decorator_class = nil)
        decorated = decorator_class ? decorate_collection(collection, decorator_class) : collection
        render json: {
          data: decorated,
          pagination: {
            current_page: collection.current_page,
            per_page: collection.limit_value,
            total_pages: collection.total_pages,
            total_count: collection.total_count
          }
        }
      end
    end
  end
end
