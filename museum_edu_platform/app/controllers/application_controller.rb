class ApplicationController < ActionController::Base
  allow_browser versions: :modern

  include Pundit::Authorization
  before_action :authenticate_user!
  before_action :configure_permitted_parameters, if: :devise_controller?
  before_action :set_mobile_flag

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found

  helper_method :mobile_device?
  helper_method :current_user

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :phone, :role])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name, :phone])
  end

  def after_sign_in_path_for(resource)
    if resource.admin? || resource.teacher?
      admin_dashboard_path
    elsif resource.guide?
      guide_dashboard_path
    else
      root_path
    end
  end

  def after_sign_out_path_for(_resource)
    new_user_session_path
  end

  private

  def set_mobile_flag
    request.variant = :mobile if mobile_device?
  end

  def mobile_device?
    request.user_agent =~ /Mobile|webOS|Android|iPhone|iPad|iPod/
  end

  def user_not_authorized
    flash[:alert] = '您没有权限执行此操作'
    redirect_back(fallback_location: root_path)
  end

  def record_not_found
    flash[:alert] = '记录不存在'
    redirect_back(fallback_location: root_path)
  end
end
