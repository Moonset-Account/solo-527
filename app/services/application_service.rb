class ApplicationService
  attr_reader :errors

  def initialize
    @errors = []
  end

  def success?
    @errors.empty?
  end

  def fail!
    raise StandardError, @errors.join('; ')
  end

  private

  def add_error(message)
    @errors << message
  end

  def add_errors_from(object)
    object.errors.full_messages.each { |msg| add_error(msg) }
  end
end
