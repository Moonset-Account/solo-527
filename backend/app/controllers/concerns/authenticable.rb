module Authenticable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_request!
  end

  def current_user
    @current_user
  end

  private

  def authenticate_request!
    header = request.headers['Authorization']
    header = header.split(' ').last if header

    decoded = JwtService.decode(header)
    if decoded
      @current_user = User.find_by(id: decoded[:user_id])
    end

    render json: { error: '未授权访问' }, status: :unauthorized unless @current_user&.active?
  end
end
