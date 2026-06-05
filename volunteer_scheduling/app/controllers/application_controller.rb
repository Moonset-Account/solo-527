class ApplicationController < ActionController::Base
  include Pundit::Authorization

  allow_browser versions: :modern

  before_action :configure_permitted_parameters, if: :devise_controller?
  before_action :authenticate_user!

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  def after_sign_in_path_for(resource)
    root_path
  end

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :phone, :role])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name, :phone])
  end

  def user_not_authorized
    flash[:alert] = "您没有权限执行此操作。"
    redirect_back(fallback_location: root_path)
  end
end

