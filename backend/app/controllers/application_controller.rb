class ApplicationController < ActionController::API
  include Authenticable

  rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :handle_invalid
  rescue_from StandardError, with: :handle_standard_error

  private

  def handle_not_found(exception)
    ErrorLog.log('error', exception.message, controller: controller_name, action: action_name, error_class: exception.class.name, user: current_user)
    render json: { error: '记录不存在' }, status: :not_found
  end

  def handle_invalid(exception)
    ErrorLog.log('warning', exception.message, controller: controller_name, action: action_name, error_class: exception.class.name, user: current_user)
    render json: { error: exception.record.errors.full_messages.join(', ') }, status: :unprocessable_entity
  end

  def handle_standard_error(exception)
    ErrorLog.log('error', exception.message, controller: controller_name, action: action_name, error_class: exception.class.name, backtrace: exception.backtrace, user: current_user, request_info: { url: request.url, method: request.method, params: params.to_unsafe_h })
    render json: { error: '服务器内部错误' }, status: :internal_server_error
  end

  def authorize_admin!
    render json: { error: '权限不足' }, status: :forbidden unless current_user.role == 'admin'
  end

  def authorize_manage!
    render json: { error: '权限不足' }, status: :forbidden unless current_user.can_manage?
  end

  def authorize_approve!
    render json: { error: '权限不足' }, status: :forbidden unless current_user.can_approve?
  end

  def paginate(collection)
    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 20).to_i
    collection.page(page).per(per_page)
  end

  def render_paginated(collection, serializer = nil)
    paginated = paginate(collection)
    if serializer
      render json: {
        data: serializer.new(paginated),
        meta: {
          current_page: paginated.current_page,
          total_pages: paginated.total_pages,
          total_count: paginated.total_count
        }
      }
    else
      render json: {
        data: paginated,
        meta: {
          current_page: paginated.current_page,
          total_pages: paginated.total_pages,
          total_count: paginated.total_count
        }
      }
    end
  end
end
