class ApplicationController < ActionController::Base
  allow_browser versions: :modern
  stale_when_importmap_changes

  include StatusTransitionable

  before_action :authenticate_user!
  before_action :set_current_user

  helper_method :current_user_admin?

  private

  def set_current_user
    Current.user = current_user
  end

  def current_user_admin?
    current_user&.role == "admin"
  end

  def require_admin!
    return if current_user_admin?

    redirect_to root_path, alert: "You are not authorized to perform this action."
  end
end
