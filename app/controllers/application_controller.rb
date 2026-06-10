class ApplicationController < ActionController::Base
  helper_method :current_user, :logged_in?, :admin?

  private

  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  def logged_in?
    !!current_user
  end

  def admin?
    current_user&.admin?
  end

  def require_login
    unless logged_in?
      redirect_to login_path, alert: "请先登录"
    end
  end

  def require_admin
    unless admin? || current_user&.ops?
      redirect_to root_path, alert: "无权限访问"
    end
  end
end
