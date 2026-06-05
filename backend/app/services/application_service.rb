class ApplicationService
  attr_reader :params, :current_user, :options

  def initialize(params = {}, current_user = nil, options = {})
    @params = params
    @current_user = current_user
    @options = options
  end

  def call
    raise NotImplementedError, '子类必须实现 call 方法'
  end

  private

  def success(data = nil)
    OpenStruct.new(success?: true, data: data, errors: [])
  end

  def error(message, errors = [])
    errors = [message] if errors.empty? && message.present?
    OpenStruct.new(success?: false, data: nil, errors: errors)
  end

  def log_audit(action, auditable, old_values = {}, new_values = {})
    AuditLog.log!(
      current_user,
      action,
      auditable,
      old_values,
      new_values,
      ip_address: options[:ip_address],
      user_agent: options[:user_agent]
    )
  end

  def send_notification(user, title, content, type, metadata = {})
    Notification.send_notification!(user, title, content, type, metadata)
  end
end
