module Api::V1::Authenticable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user!
    before_action :set_current_user_context
  end

  private

  def authenticate_user!
    token = request.headers['Authorization']&.split(' ')&.last
    return unauthorized_error unless token

    begin
      decoded = JsonWebToken.decode(token)
      @current_user = User.find(decoded[:user_id])
      return unauthorized_error unless @current_user.active?
    rescue JWT::DecodeError, ActiveRecord::RecordNotFound
      unauthorized_error
    end
  end

  def current_user
    @current_user
  end

  def set_current_user_context
    return unless current_user
    RequestStore.store[:current_user_id] = current_user.id
    RequestStore.store[:current_ip] = request.remote_ip
    RequestStore.store[:current_user_agent] = request.user_agent
  end

  def unauthorized_error
    render json: { error: '未授权访问，请先登录' }, status: :unauthorized
  end

  def authorize_admin!
    unless current_user.admin?
      render json: { error: '无权限执行此操作' }, status: :forbidden
    end
  end
end
