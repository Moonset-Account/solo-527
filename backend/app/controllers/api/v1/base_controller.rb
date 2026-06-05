class Api::V1::BaseController < ApplicationController
  include Api::V1::Authenticable
  include Api::V1::Exportable
  include Pundit::Authorization

  before_action :configure_permitted_parameters, if: :devise_controller?

  protect_from_forgery with: :null_session
  respond_to :json

  rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found
  rescue_from Pundit::NotAuthorizedError, with: :handle_forbidden
  rescue_from ActiveRecord::RecordInvalid, with: :handle_validation_error

  private

  def handle_not_found(exception)
    render json: { error: exception.message || '资源不存在' }, status: :not_found
  end

  def handle_forbidden
    render json: { error: '无权限执行此操作' }, status: :forbidden
  end

  def handle_validation_error(exception)
    render json: {
      error: '数据校验失败',
      errors: exception.record.errors.full_messages
    }, status: :unprocessable_entity
  end

  def service_result(result)
    if result.success?
      render json: result.data, status: :ok
    else
      render json: { error: result.errors.first || '操作失败', errors: result.errors }, status: :unprocessable_entity
    end
  end

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :phone, :email, :role])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name, :email, :avatar_url])
  end
end
