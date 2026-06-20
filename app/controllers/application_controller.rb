class ApplicationController < ActionController::Base
  include Pundit::Authorization

  allow_browser versions: :modern

  before_action :authenticate_user!
  before_action :configure_permitted_parameters, if: :devise_controller?

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :phone])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name, :phone])
  end

  def after_sign_in_path_for(resource)
    if resource.can_access_admin?
      admin_dashboard_path
    else
      root_path
    end
  end

  private

  def user_not_authorized
    flash[:alert] = "您没有权限执行此操作。"
    redirect_back(fallback_location: root_path)
  end

  def set_batch_job_for(job_class)
    @batch_job = BatchJob.create!(
      job_type: job_type_from_class(job_class),
      user: current_user,
      status: "pending"
    )
  end

  def job_type_from_class(klass)
    klass.name.underscore.gsub("_job", "")
  end
end
