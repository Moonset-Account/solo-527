class QualityInspectionService
  def initialize(process_step, inspector, params)
    @process_step = process_step
    @inspector = inspector
    @params = params
  end

  def create!
    QualityInspection.transaction do
      inspection = QualityInspection.create!(
        process_step: @process_step,
        inspector: @inspector,
        result: @params[:result],
        defect_type: @params[:defect_type],
        defect_quantity: @params[:defect_quantity] || 0,
        inspection_time: Time.current,
        notes: @params[:notes]
      )

      if inspection.fail? || inspection.rework?
        details = {
          quality_inspection_id: inspection.id,
          result: inspection.result,
          defect_type: inspection.defect_type,
          defect_quantity: inspection.defect_quantity
        }
        AuditLog.create!(
          user: @inspector,
          action_type: inspection.fail? ? "质检不合格" : "质检返工",
          entity_type: "QualityInspection",
          entity_id: inspection.id,
          details: details.to_json
        )
      end

      if inspection.pass?
        @process_step.update!(status: :completed)
      end

      inspection
    end
  end
end
