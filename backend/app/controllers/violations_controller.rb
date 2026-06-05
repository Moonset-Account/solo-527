class ViolationsController < ApplicationController
  def index
    scope = Violation.all.includes(:person, :vehicle, :pass, :work_zone, :reporter)
    scope = scope.by_severity(params[:severity]) if params[:severity].present?
    scope = scope.by_status(params[:status]) if params[:status].present?
    scope = scope.recent
    render_paginated(scope)
  end

  def show
    violation = Violation.find(params[:id])
    render json: violation
  end

  def create
    violation = Violation.new(violation_params)
    violation.reporter = current_user
    violation.violated_at ||= Time.current

    if violation.save
      if violation.result_in_freeze? && violation.pass
        violation.pass.freeze!("违规冻结：#{violation.violation_type_name}")
      end

      NotificationJob.perform_later(violation, 'violation_reported', current_user)

      render json: violation, status: :created
    else
      render json: { error: violation.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  def update
    authorize_manage!
    violation = Violation.find(params[:id])
    if violation.update(violation_params)
      render json: violation
    else
      render json: { error: violation.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  def monthly_stats
    month = params[:month] ? Date.parse(params[:month]) : Date.current
    start_date = month.beginning_of_month
    end_date = month.end_of_month

    violations = Violation.where(violated_at: start_date..end_date)

    stats = {
      month: month.strftime('%Y-%m'),
      total: violations.count,
      by_type: violations.group(:violation_type).count,
      by_severity: violations.group(:severity).count,
      by_zone: violations.group(:work_zone_id).count
    }

    render json: stats
  end

  private

  def violation_params
    params.permit(:person_id, :vehicle_id, :pass_id, :work_zone_id, :violation_type, :description, :violated_at, :location, :severity, :status, :handling_notes, :result_in_freeze, :freeze_days)
  end
end
