class Admin::BaseController < ApplicationController
  layout 'admin'

  before_action :authenticate_user!
  before_action :verify_admin

  private

  def verify_admin
    redirect_to root_path, alert: '您没有管理员权限。' unless current_user&.admin?
  end
end
