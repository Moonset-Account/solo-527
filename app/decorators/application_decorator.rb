class ApplicationDecorator < Draper::Decorator
  delegate_all

  def current_user
    context[:current_user]
  end

  def can_view_sensitive?
    current_user&.can_view_sensitive_data?
  end

  def mask_sensitive(value, visible: false)
    return value if visible || can_view_sensitive?
    return nil if value.nil?
    return '***' if value.is_a?(String) && value.length <= 3
    value[0] + '*' * (value.length - 2) + value[-1]
  end

  def as_json(options = {})
    super(options).tap do |hash|
      filter_sensitive_fields!(hash)
    end
  end

  private

  def filter_sensitive_fields!(hash)
    return if can_view_sensitive?
    self.class.sensitive_fields.each do |field|
      hash[field] = mask_sensitive(hash[field]) if hash.key?(field)
    end
  end

  def self.sensitive_fields
    []
  end
end
