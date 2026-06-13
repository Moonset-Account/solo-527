class ApplicationController < ActionController::Base
  include Pundit::Authorization
  protect_from_forgery with: :exception
  before_action :authenticate_user!
  before_action :configure_permitted_parameters, if: :devise_controller?
  after_action :verify_authorized, except: :index, unless: :skip_pundit?
  after_action :verify_policy_scoped, only: :index, unless: :skip_pundit?

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  private

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :phone, :role])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name, :phone, :role])
  end

  def user_not_authorized
    flash[:alert] = "您没有权限执行此操作。"
    redirect_back(fallback_location: root_path)
  end

  def skip_pundit?
    devise_controller? || params[:controller] =~ /^(rails_admin|active_admin)/
  end

  def current_user_context
    { user_id: current_user&.id, user_name: current_user&.name, ip: request.remote_ip }
  end
end
