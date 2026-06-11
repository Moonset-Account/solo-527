class WaitingListChangeLogsController < ApplicationController
  def index
    @q = WaitingListChangeLog.includes(:waiting_list, :appointment).ransack(params[:q])
    @change_logs = @q.result.order(changed_at: :desc).page(params[:page]).per(50)
  end
end
