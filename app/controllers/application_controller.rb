class ApplicationController < ActionController::Base
  include Pundit::Authorization

  allow_browser versions: :modern

  before_action :authenticate_user!, unless: :devise_controller?

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  after_action :verify_pundit, unless: :devise_controller?

  helper_method :current_user, :user_signed_in?

  private

  def verify_pundit
    if action_name == 'index'
      verify_policy_scoped
    else
      verify_authorized
    end
  rescue Pundit::AuthorizationNotPerformedError
    nil
  end

  def user_not_authorized
    unless user_signed_in?
      flash[:alert] = '请先登录后再操作。'
      redirect_to new_user_session_path
    else
      flash[:alert] = '您没有权限执行此操作。'
      redirect_to(request.referrer || root_path)
    end
  end
end
