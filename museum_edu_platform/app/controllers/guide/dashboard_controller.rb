module Guide
  class DashboardController < ApplicationController
    before_action :authorize_guide!

    layout 'admin'

    def index
      @today_sessions = current_user.guided_sessions.today
      @upcoming_sessions = current_user.guided_sessions.upcoming.limit(5)
    end

    private

    def authorize_guide!
      unless current_user.guide? || current_user.admin?
        redirect_to root_path, alert: '您没有权限访问此页面'
      end
    end
  end
end
