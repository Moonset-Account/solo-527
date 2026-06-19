module OperationLoggable
  extend ActiveSupport::Concern

  included do
    after_action :log_operation, only: [:create, :update, :destroy]
  end

  private

  def log_operation
    return unless current_user

    action = case action_name
             when 'create' then 'create'
             when 'update' then 'update'
             when 'destroy' then 'destroy'
             else action_name
             end

    target = instance_variable_get("@#{controller_name.singularize}")

    details = {}
    if params.respond_to?(:to_unsafe_h)
      details = params.except(:controller, :action, :id, :format, :utf8, :authenticity_token).to_unsafe_h
    else
      details = params.except(:controller, :action, :id, :format, :utf8, :authenticity_token).to_h
    end

    OperationLogJob.perform_async(
      current_user.id,
      action,
      target&.class&.name,
      target&.id,
      details
    )
  end
end
