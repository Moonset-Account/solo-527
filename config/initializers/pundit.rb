Pundit::NotAuthorizedError.module_eval do
  def user_message
    "您没有权限执行此操作"
  end
end
