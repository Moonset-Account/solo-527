class WorkOrderCsvExporter
  def initialize(work_orders)
    @work_orders = work_orders
  end

  def to_csv
    require "csv"
    CSV.generate(headers: true) do |csv|
      csv << ["工单号", "产品名称", "数量", "客户", "优先级", "状态", "计划开始", "计划结束", "实际开始", "实际完成", "备注", "工序数"]
      @work_orders.each do |wo|
        csv << [
          wo.order_no,
          wo.product_name,
          wo.quantity,
          wo.customer,
          I18n.t("enums.work_order.priority.#{wo.priority}", default: wo.priority),
          I18n.t("enums.work_order.status.#{wo.status}", default: wo.status),
          wo.planned_start_date,
          wo.planned_end_date,
          wo.process_steps.minimum(:started_at),
          wo.process_steps.maximum(:completed_at),
          wo.notes,
          wo.process_steps.count
        ]
      end
    end
  end
end

class QualityInspectionCsvExporter
  def initialize(inspections)
    @inspections = inspections
  end

  def to_csv
    require "csv"
    CSV.generate(headers: true) do |csv|
      csv << ["工单号", "工序", "检验员", "结果", "缺陷类型", "缺陷数量", "检验时间", "备注"]
      @inspections.each do |qi|
        csv << [
          qi.process_step.work_order.order_no,
          qi.process_step.name,
          qi.inspector.name,
          I18n.t("enums.quality_inspection.result.#{qi.result}", default: qi.result),
          qi.defect_type,
          qi.defect_quantity,
          qi.inspection_time,
          qi.notes
        ]
      end
    end
  end
end

class ProcessEfficiencyCsvExporter
  def initialize(efficiencies)
    @efficiencies = efficiencies
  end

  def to_csv
    require "csv"
    CSV.generate(headers: true) do |csv|
      csv << ["工单号", "工序", "设备", "班组", "模具", "标准产量/小时", "实际产量/小时", "耗时(小时)", "效率(%)"]
      @efficiencies.each do |pe|
        csv << [
          pe.process_step.work_order.order_no,
          pe.process_step.name,
          pe.equipment&.name,
          pe.team&.name,
          pe.mold&.code,
          pe.standard_output_per_hour,
          pe.actual_output_per_hour,
          pe.duration_hours,
          pe.efficiency_rate
        ]
      end
    end
  end
end
