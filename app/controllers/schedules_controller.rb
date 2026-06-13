class SchedulesController < ApplicationController
  def index
    authorize :schedule, :index?
    @date = params[:date] ? Date.parse(params[:date]) : Date.today
    @view_mode = params[:view] || 'day'

    case @view_mode
    when 'week'
      @start_date = @date.beginning_of_week
      @end_date = @date.end_of_week
    when 'month'
      @start_date = @date.beginning_of_month
      @end_date = @date.end_of_month
    else
      @start_date = @date
      @end_date = @date
    end

    @q = policy_scope(WorkOrder).ransack(params[:q])
    @work_orders = @q.result
      .includes(:process_steps, process_steps: [:assigned_team, :assigned_equipment, :mold])
      .where("planned_start_date <= ? AND planned_end_date >= ?", @end_date, @start_date)
      .by_priority

    @teams = Team.all.order(shift: :asc, name: :asc)
    @equipment = Equipment.available_for_production.order(code: :asc)
  end

  def show
    @date = params[:date] ? Date.parse(params[:date]) : Date.today
    @work_order = WorkOrder.find(params[:id])
    authorize @work_order, :show?
    @process_steps = @work_order.process_steps.order(sequence: :asc)
  end

  def by_team
    authorize :schedule, :by_team?
    @date = params[:date] ? Date.parse(params[:date]) : Date.today
    @team = Team.find(params[:id])
    @process_steps = @team.process_steps
      .includes(:work_order, :assigned_equipment, :mold)
      .where("DATE(started_at) = ? OR DATE(completed_at) = ? OR status IN (?)",
             @date, @date, [:in_progress, :paused, :quality_check])
      .order(created_at: :desc)
  end

  def by_equipment
    authorize :schedule, :by_equipment?
    @date = params[:date] ? Date.parse(params[:date]) : Date.today
    @equipment = Equipment.find(params[:id])
    @process_steps = @equipment.process_steps
      .includes(:work_order, :assigned_team, :mold)
      .where("DATE(started_at) = ? OR DATE(completed_at) = ? OR status IN (?)",
             @date, @date, [:in_progress, :paused, :quality_check])
      .order(created_at: :desc)
  end

  def gantt
    authorize :schedule, :gantt?
    @start_date = params[:start_date] ? Date.parse(params[:start_date]) : Date.today.beginning_of_week
    @end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today.end_of_week

    @work_orders = policy_scope(WorkOrder)
      .includes(:process_steps)
      .where("planned_start_date <= ? AND planned_end_date >= ?", @end_date, @start_date)
      .order(priority: :desc, planned_start_date: :asc)
  end
end
