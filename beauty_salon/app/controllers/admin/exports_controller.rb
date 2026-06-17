class Admin::ExportsController < ApplicationController
  layout "admin"

  def create
    ExportJob.perform_later(
      params[:model_name],
      export_filters
    )
    redirect_back fallback_location: admin_dashboard_path, notice: "导出任务已提交，完成后将通知您"
  end

  private

  def export_filters
    params.permit(:status, :category, :technician_id, :customer_id, :start_date, :end_date).to_h.compact_blank
  end
end
