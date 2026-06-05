module Api
  module V1
    class PassesController < ApplicationController
      def index
        scope = Pass.all.includes(:person, :vehicle, :work_zones, :approvals)
        scope = scope.by_status(params[:status]) if params[:status].present?
        scope = scope.where(pass_type: params[:pass_type]) if params[:pass_type].present?
        scope = scope.where(is_frozen: params[:frozen]) if params[:frozen].present?
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

            begin
              NotificationJob.perform_later(pass, 'pass_created', current_user)
            rescue => e
              Rails.logger.warn "Failed to enqueue notification: #{e.message}"
            end

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
          frozen: pass.is_frozen?,
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

        work_zone_ids = params[:work_zone_ids] || []
        work_zones = WorkZone.where(id: work_zone_ids)

        credential_result = validate_credentials(person, work_zones)
        return credential_result unless credential_result[:valid]

        capacity_result = validate_capacity(work_zones)
        return capacity_result unless capacity_result[:valid]

        time_result = validate_time_restrictions(work_zones, pass.valid_from, pass.valid_until)
        return time_result unless time_result[:valid]

        { valid: true }
      end

      def validate_credentials(person, work_zones)
        return { valid: true } unless work_zones.exists?(zone_type: 'dangerous')

        valid_credentials = person.credentials.valid
        has_special_cert = valid_credentials.exists?(credential_type: %w[special_operation safety_certificate])

        unless has_special_cert
          return {
            valid: false,
            message: '进入危险区域需要有效的特种作业证或安全员证'
          }
        end

        { valid: true }
      end

      def validate_capacity(work_zones)
        work_zones.each do |zone|
          next unless zone.max_capacity.present? && zone.max_capacity > 0

          current_count = zone.passes.active.count
          if current_count >= zone.max_capacity
            return {
              valid: false,
              message: "作业区域【#{zone.name}】已达最大容量（#{zone.max_capacity}人），无法再申请"
            }
          end
        end

        { valid: true }
      end

      def validate_time_restrictions(work_zones, valid_from, valid_until)
        work_zones.each do |zone|
          next if zone.time_restrictions.blank?

          unless check_time_allowed(zone.time_restrictions, valid_from, valid_until)
            return {
              valid: false,
              message: "作业区域【#{zone.name}】有时段限制：#{zone.time_restrictions}"
            }
          end
        end

        { valid: true }
      end

      def check_time_allowed(restrictions, valid_from, valid_until)
        return true if restrictions.blank?

        allowed_ranges = parse_time_restrictions(restrictions)
        return true if allowed_ranges.empty?

        check_start = valid_from || Time.current
        check_end = valid_until || check_start

        (check_start.to_i..check_end.to_i).step(3600) do |time_i|
          time = Time.at(time_i).getlocal
          hour = time.hour
          allowed = allowed_ranges.any? { |start_h, end_h| hour >= start_h && hour < end_h }
          return false unless allowed
        end

        true
      end

      def parse_time_restrictions(restrictions)
        return [] if restrictions.blank?

        restrictions.scan(/(\d{1,2})[:：](\d{2})\s*[-~到]\s*(\d{1,2})[:：](\d{2})/).map do |start_h, start_m, end_h, end_m|
          [start_h.to_i, end_h.to_i]
        end
      end

      def create_initial_approvals(pass)
        requires_second = pass.work_zones.exists?(requires_second_approval: true)

        pass.approvals.create!(approval_level: 1, status: 'pending')
        if requires_second
          pass.approvals.create!(approval_level: 2, status: 'pending')
        end
      end
    end
  end
end
