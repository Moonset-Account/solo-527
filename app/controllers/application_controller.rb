class ApplicationController < ActionController::Base
  include Pundit::Authorization

  layout :layout_by_resource

  before_action :authenticate_user!
  before_action :set_paper_trail_whodunnit
  before_action :configure_permitted_parameters, if: :devise_controller?

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name])
  end

  def set_paper_trail_whodunnit
    PaperTrail.request.whodunnit = current_user&.id.to_s if user_signed_in?
  end

  def layout_by_resource
    if devise_controller? && !user_signed_in?
      "devise"
    else
      "application"
    end
  end

  def after_sign_in_path_for(resource)
    root_path
  end

  def after_sign_out_path_for(resource_or_scope)
    new_user_session_path
  end

  def user_not_authorized
    flash[:alert] = '您没有权限执行此操作。'
    redirect_back(fallback_location: root_path)
  end
end
