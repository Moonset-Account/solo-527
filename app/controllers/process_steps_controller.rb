class ProcessStepsController < ApplicationController
  before_action :set_work_order_and_step

  def show
    authorize @process_step
    @quality_inspections = @process_step.quality_inspections.includes(:inspector)
    @efficiencies = @process_step.process_efficiencies.includes(:equipment, :team, :mold)
  end

  def update
    authorize @process_step
    if @process_step.update(process_step_params)
      redirect_to work_order_process_step_path(@work_order, @process_step), notice: "工序更新成功。"
    else
      render :show
    end
  end

  def start
    authorize @process_step
    service = WorkOrderFlowService.new(@process_step, current_user)
    if service.start!(equipment_id: params[:equipment_id], team_id: params[:team_id], mold_id: params[:mold_id])
      ProcessStepSyncJob.perform_later(@work_order.id, @process_step.id, action: "start")
      redirect_to work_order_path(@work_order), notice: "工序已开始。"
    else
      redirect_to work_order_path(@work_order), alert: "工序开始失败。"
    end
  end

  def pause
    authorize @process_step
    service = WorkOrderFlowService.new(@process_step, current_user)
    if service.pause!
      redirect_to work_order_path(@work_order), notice: "工序已暂停。"
    else
      redirect_to work_order_path(@work_order), alert: "工序暂停失败。"
    end
  end

  def resume
    authorize @process_step
    service = WorkOrderFlowService.new(@process_step, current_user)
    if service.resume!
      redirect_to work_order_path(@work_order), notice: "工序已恢复。"
    else
      redirect_to work_order_path(@work_order), alert: "工序恢复失败。"
    end
  end

  def complete
    authorize @process_step
    service = WorkOrderFlowService.new(@process_step, current_user)
    if service.complete!(actual_quantity: params[:actual_quantity].to_i, defect_quantity: params[:defect_quantity].to_i)
      ProcessStepSyncJob.perform_later(@work_order.id, @process_step.id, action: "complete")
      redirect_to work_order_process_step_path(@work_order, @process_step), notice: "工序已完成，等待质检。"
    else
      redirect_to work_order_process_step_path(@work_order, @process_step), alert: "工序完成失败。"
    end
  end

  def continue_processing
    authorize @process_step
    service = WorkOrderFlowService.new(@process_step, current_user)
    if service.continue_processing!
      redirect_to work_order_path(@work_order), notice: "已继续处理此工序。"
    else
      redirect_to work_order_path(@work_order), alert: "继续处理失败。"
    end
  end

  private

  def set_work_order_and_step
    @work_order = WorkOrder.find(params[:work_order_id])
    @process_step = @work_order.process_steps.find(params[:id])
  end

  def process_step_params
    params.require(:process_step).permit(:assigned_team_id, :assigned_equipment_id, :mold_id, :notes)
  end
end
