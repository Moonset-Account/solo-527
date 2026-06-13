class ExportsController < ApplicationController
  def index
    authorize :export, :index?
  end

  def work_orders
    authorize :export, :work_orders?
    @work_orders = WorkOrder.includes(:process_steps).order(created_at: :desc)
    respond_to do |format|
      format.xlsx {
        response.headers['Content-Disposition'] = "attachment; filename=work_orders_#{Date.today}.xlsx"
      }
      format.csv { send_data WorkOrderCsvExporter.new(@work_orders).to_csv, filename: "work_orders_#{Date.today}.csv" }
    end
    AuditLog.create!(user: current_user, action_type: "导出工单数据", entity_type: "WorkOrder", details: { count: @work_orders.count, format: params[:format] }.to_json)
  end

  def quality_inspections
    authorize :export, :quality_inspections?
    @quality_inspections = QualityInspection.includes(:process_step, :inspector).order(inspection_time: :desc)
    respond_to do |format|
      format.xlsx {
        response.headers['Content-Disposition'] = "attachment; filename=quality_inspections_#{Date.today}.xlsx"
      }
      format.csv { send_data QualityInspectionCsvExporter.new(@quality_inspections).to_csv, filename: "quality_inspections_#{Date.today}.csv" }
    end
    AuditLog.create!(user: current_user, action_type: "导出质检数据", entity_type: "QualityInspection", details: { count: @quality_inspections.count, format: params[:format] }.to_json)
  end

  def process_efficiencies
    authorize :export, :process_efficiencies?
    @process_efficiencies = ProcessEfficiency.includes(:process_step, :equipment, :team, :mold).order(created_at: :desc)
    respond_to do |format|
      format.xlsx {
        response.headers['Content-Disposition'] = "attachment; filename=process_efficiencies_#{Date.today}.xlsx"
      }
      format.csv { send_data ProcessEfficiencyCsvExporter.new(@process_efficiencies).to_csv, filename: "process_efficiencies_#{Date.today}.csv" }
    end
    AuditLog.create!(user: current_user, action_type: "导出工序效率数据", entity_type: "ProcessEfficiency", details: { count: @process_efficiencies.count, format: params[:format] }.to_json)
  end
end
