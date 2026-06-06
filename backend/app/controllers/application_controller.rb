class ApplicationController < ActionController::API
  include DeviseTokenAuth::Concerns::SetUserByToken
  include Pundit::Authorization

  before_action :configure_permitted_parameters, if: :devise_controller?
  before_action :set_audit_user

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :record_invalid

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :phone, :role, :avatar])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name, :phone, :avatar])
  end

  def set_audit_user
    Audited.current_user_method = :current_user
  end

  def user_not_authorized
    render json: { error: 'You are not authorized to perform this action.' }, status: :forbidden
  end

  def record_not_found
    render json: { error: 'Record not found.' }, status: :not_found
  end

  def record_invalid(exception)
    render json: { error: exception.record.errors.full_messages }, status: :unprocessable_entity
  end

  def paginate(collection, options = {})
    collection = collection.page(params[:page]).per(params[:per_page] || 10)
    {
      data: options[:include] ? collection.includes(options[:include]) : collection,
      meta: {
        current_page: collection.current_page,
        next_page: collection.next_page,
        prev_page: collection.prev_page,
        total_pages: collection.total_pages,
        total_count: collection.total_count
      }
    }
  end
end
