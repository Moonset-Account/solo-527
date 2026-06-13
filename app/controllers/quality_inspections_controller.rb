class QualityInspectionsController < ApplicationController
  before_action :set_work_order_and_step

  def new
    @quality_inspection = QualityInspection.new
    authorize @quality_inspection
  end

  def create
    authorize QualityInspection
    service = QualityInspectionService.new(@process_step, current_user, quality_inspection_params)
    begin
      service.create!
      ProcessStepSyncJob.perform_later(@work_order.id, @process_step.id, action: "quality_inspection")
      redirect_to work_order_process_step_path(@work_order, @process_step), notice: "质检记录已创建。"
    rescue => e
      @quality_inspection = @process_step.quality_inspections.build(quality_inspection_params)
      flash.now[:alert] = "质检记录创建失败: #{e.message}"
      render :new
    end
  end

  private

  def set_work_order_and_step
    @work_order = WorkOrder.find(params[:work_order_id])
    @process_step = @work_order.process_steps.find(params[:process_step_id])
  end

  def quality_inspection_params
    params.require(:quality_inspection).permit(:result, :defect_type, :defect_quantity, :notes)
  end
end
