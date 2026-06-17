class Admin::ApiFailureLogsController < ApplicationController
  layout "admin"

  before_action :set_api_failure_log, only: [:show, :retry, :add_note]

  def index
    @api_failure_logs = ApiFailureLog.recent
    @api_failure_logs = @api_failure_logs.where(status: params[:status]) if params[:status].present?
  end

  def show
  end

  def retry
    if @api_failure_log.can_retry?
      @api_failure_log.retry!
      redirect_to admin_api_failure_log_path(@api_failure_log), notice: "已触发重试"
    else
      redirect_to admin_api_failure_log_path(@api_failure_log), alert: "已达到最大重试次数"
    end
  end

  def add_note
    @api_failure_log.add_note!(params[:note])
    redirect_to admin_api_failure_log_path(@api_failure_log), notice: "备注已添加"
  end

  private

  def set_api_failure_log
    @api_failure_log = ApiFailureLog.find(params[:id])
  end
end
