class PassesController < ApplicationController
  def index
    scope = Pass.all.includes(:person, :vehicle, :work_zones, :approvals)
    scope = scope.by_status(params[:status]) if params[:status].present?
    scope = scope.where(pass_type: params[:pass_type]) if params[:pass_type].present?
    scope = scope.where(frozen: params[:frozen]) if params[:frozen].present?
    scope = scope.ransack(params[:q]).result if params[:q].present?
    scope = scope.order(created_at: :desc)
    render_paginated(scope)
  end

  def show
    pass = Pass.find(params[:id])
    render json: pass.as_json(
      include: {
        person: {},
        vehicle: {},
        work_zones: {},
        approvals: { include: :approver },
        violations: { limit: 10 }
      }
    )
  end

  def create
    pass = Pass.new(pass_params)
    pass.creator = current_user

    validation_result = validate_pass_creation(pass)
    unless validation_result[:valid]
      return render json: { error: validation_result[:message] }, status: :unprocessable_entity
    end

    ActiveRecord::Base.transaction do
      if pass.save
        if params[:work_zone_ids].present?
          params[:work_zone_ids].each do |zone_id|
            pass.pass_work_zones.create!(work_zone_id: zone_id, granted_at: Time.current)
          end
        end

        create_initial_approvals(pass)

        NotificationJob.perform_later(pass, 'pass_created', current_user)

        render json: pass, status: :created
      else
        render json: { error: pass.errors.full_messages.join(', ') }, status: :unprocessable_entity
        raise ActiveRecord::Rollback
      end
    end
  end

  def update
    authorize_manage!
    pass = Pass.find(params[:id])
    if pass.update(pass_params)
      if params[:work_zone_ids].present?
        pass.pass_work_zones.destroy_all
        params[:work_zone_ids].each do |zone_id|
          pass.pass_work_zones.create!(work_zone_id: zone_id, granted_at: Time.current)
        end
      end
      render json: pass
    else
      render json: { error: pass.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  def freeze
    authorize_manage!
    pass = Pass.find(params[:id])
    pass.freeze!(params[:reason])
    render json: { message: '通行证已冻结', pass: pass }
  end

  def unfreeze
    authorize_manage!
    pass = Pass.find(params[:id])
    pass.unfreeze!
    render json: { message: '通行证已解冻', pass: pass }
  end

  def validate_pass_number
    pass = Pass.find_by(pass_number: params[:pass_number])
    unless pass
      return render json: { valid: false, message: '通行证不存在' }
    end
    render json: {
      valid: pass.currently_valid?,
      status: pass.status_name,
      frozen: pass.frozen?,
      expired: pass.expired?,
      fully_approved: pass.fully_approved?,
      pass: pass.as_json(include: [:person, :vehicle, :work_zones])
    }
  end

  private

  def pass_params
    params.permit(:person_id, :vehicle_id, :pass_type, :purpose, :valid_from, :valid_until, :remark)
  end

  def validate_pass_creation(pass)
    person = pass.person
    return { valid: false, message: '该人员已在黑名单中' } if person.blacklisted?

    if pass.vehicle&.blacklisted?
      return { valid: false, message: '该车辆已在黑名单中' }
    end

    if pass.valid_from >= pass.valid_until
      return { valid: false, message: '有效期开始时间必须早于结束时间' }
    end

    { valid: true }
  end

  def create_initial_approvals(pass)
    requires_second = pass.work_zones.exists?(requires_second_approval: true)

    pass.approvals.create!(approval_level: 1, status: 'pending')
    if requires_second
      pass.approvals.create!(approval_level: 2, status: 'pending')
    end
  end
end
