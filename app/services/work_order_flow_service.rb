class WorkOrderFlowService
  def initialize(process_step, current_user)
    @process_step = process_step
    @current_user = @user = current_user
    @work_order = process_step.work_order
  end

  def start!(equipment_id: nil, team_id: nil, mold_id: nil)
    ProcessStep.transaction do
      @process_step.assign_attributes(
        status: :in_progress,
        started_at: Time.current,
        assigned_equipment_id: equipment_id || @process_step.assigned_equipment_id,
        assigned_team_id: team_id || @process_step.assigned_team_id,
        mold_id: mold_id || @process_step.mold_id
      )
      @process_step.save!

      if @work_order.pending?
        @work_order.update!(status: :in_progress)
      end

      create_audit_log("工序开始", { process_step_id: @process_step.id, name: @process_step.name })
    end
    true
  rescue => e
    false
  end

  def pause!
    ProcessStep.transaction do
      @process_step.update!(status: :paused, paused_at: Time.current)
      create_audit_log("工序暂停", { process_step_id: @process_step.id })
    end
    true
  rescue => e
    false
  end

  def resume!
    ProcessStep.transaction do
      @process_step.update!(status: :in_progress)
      create_audit_log("工序恢复", { process_step_id: @process_step.id })
    end
    true
  rescue => e
    false
  end

  def complete!(actual_quantity:, defect_quantity: 0)
    ProcessStep.transaction do
      duration = @process_step.started_at ? (Time.current - @process_step.started_at) / 1.hour : 0
      @process_step.assign_attributes(
        status: :quality_check,
        completed_at: Time.current,
        actual_quantity: actual_quantity,
        defect_quantity: defect_quantity
      )
      @process_step.save!

      standard = @process_step.assigned_equipment&.standard_output_per_hour || 50
      actual_per_hour = duration > 0 ? (actual_quantity / duration).round(2) : 0
      efficiency = standard > 0 ? (actual_per_hour / standard * 100).round(2) : 0

      ProcessEfficiency.create!(
        process_step: @process_step,
        equipment: @process_step.assigned_equipment,
        team: @process_step.assigned_team,
        mold: @process_step.mold,
        standard_output_per_hour: standard,
        actual_output_per_hour: actual_per_hour,
        duration_hours: duration.round(2),
        efficiency_rate: efficiency
      )

      next_step = next_process_step
      if next_step.nil?
        @work_order.update!(status: :completed)
      end

      create_audit_log("工序完成", { process_step_id: @process_step.id, actual_quantity: actual_quantity, defect_quantity: defect_quantity })
    end
    true
  rescue => e
    Rails.logger.error("完成工序失败: #{e.message}")
    false
  end

  def continue_processing!
    ProcessStep.transaction do
      @process_step.update!(status: :in_progress)
      create_audit_log("工序继续处理", { process_step_id: @process_step.id })
    end
    true
  rescue => e
    false
  end

  private

  def next_process_step
    @work_order.process_steps.where("sequence > ?", @process_step.sequence).order(sequence: :asc).first
  end

  def create_audit_log(action, details)
    AuditLog.create!(
      user: @current_user,
      action_type: action,
      entity_type: "ProcessStep",
      entity_id: @process_step.id,
      details: details.to_json
    )
  end
end
