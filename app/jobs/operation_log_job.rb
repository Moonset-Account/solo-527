class OperationLogJob < ApplicationJob
  queue_as :logs

  def perform(user_id, action, target_type = nil, target_id = nil, details = {})
    user = User.find_by(id: user_id)
    target = if target_type && target_id
               target_type.constantize.find_by(id: target_id)
             end

    OperationLog.create!(
      user: user,
      action: action,
      target: target,
      details: details
    )
  end
end
