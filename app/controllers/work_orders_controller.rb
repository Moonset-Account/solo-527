class WorkOrdersController < ApplicationController
  before_action :set_work_order, only: [:show, :edit, :update]

  def index
    @q = policy_scope(WorkOrder).ransack(params[:q])
    @work_orders = @q.result.includes(:process_steps).order(created_at: :desc).page(params[:page]).per(15)
    authorize @work_orders
  end

  def show
    authorize @work_order
    @process_steps = @work_order.process_steps.order(sequence: :asc).includes(:assigned_team, :assigned_equipment, :mold, :quality_inspections)
  end

  def new
    @work_order = WorkOrder.new
    authorize @work_order
    5.times { @work_order.process_steps.build }
  end

  def create
    @work_order = WorkOrder.new(work_order_params)
    authorize @work_order
    if @work_order.save
      redirect_to @work_order, notice: "工单创建成功。"
    else
      render :new
    end
  end

  def edit
    authorize @work_order
  end

  def update
    authorize @work_order
    if @work_order.update(work_order_params)
      redirect_to @work_order, notice: "工单更新成功。"
    else
      render :edit
    end
  end

  private

  def set_work_order
    @work_order = WorkOrder.find(params[:id])
  end

  def work_order_params
    params.require(:work_order).permit(
      :order_no, :product_name, :quantity, :planned_start_date,
      :planned_end_date, :status, :priority, :notes, :customer,
      process_steps_attributes: [:id, :name, :sequence, :_destroy, :assigned_team_id, :assigned_equipment_id, :mold_id]
    )
  end
end
