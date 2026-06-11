class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  helper_method :current_operator

  private

  def current_operator
    @current_operator ||= "system"
  end
end
