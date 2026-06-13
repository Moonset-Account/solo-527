class DashboardController < ApplicationController
  def index
    authorize :dashboard, :index?
    @work_orders = policy_scope(WorkOrder).includes(:process_steps)
      .order(created_at: :desc).page(params[:page]).per(10)
    @in_progress_count = @work_orders.where(status: :in_progress).count
    @pending_count = @work_orders.where(status: :pending).count
    @completed_today = @work_orders.where(status: :completed).where("updated_at >= ?", Date.today).count
    @failed_batches_count = FailedBatch.where(status: [:pending, :processing]).count
    @today_process_steps = ProcessStep.where("created_at >= ?", Date.today)
      .or(ProcessStep.where("updated_at >= ?", Date.today))
      .includes(:work_order, :assigned_team, :assigned_equipment)
  end
end
