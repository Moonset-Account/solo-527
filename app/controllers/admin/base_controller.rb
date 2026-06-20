module Admin
  class BaseController < ApplicationController
    before_action :ensure_admin_access!
    layout "admin"

    private

    def ensure_admin_access!
      unless current_user&.can_access_admin?
        redirect_to root_path, alert: "您没有权限访问管理后台。"
      end
    end
  end
end
