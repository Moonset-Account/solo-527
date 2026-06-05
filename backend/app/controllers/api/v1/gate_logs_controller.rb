module Api
  module V1
    class GateLogsController < ApplicationController
      def index
        scope = GateLog.all.includes(:pass, :person, :vehicle, :operator)
        scope = scope.by_gate(params[:gate_name]) if params[:gate_name].present?
        scope = scope.by_date(params[:date]) if params[:date].present?
        scope = scope.recent
        render_paginated(scope)
      end

      def create
        gate_log = GateLog.new(gate_log_params)
        gate_log.operator = current_user
        gate_log.logged_at ||= Time.current

        if gate_log.save
          render json: gate_log, status: :created
        else
          render json: { error: gate_log.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      def verify_and_log
        pass_number = params[:pass_number]
        id_card = params[:id_card]
        plate_number = params[:plate_number]
        gate_name = params[:gate_name] || '东门'
        action = params[:action_type] || 'in'

        pass = nil
        person = nil
        vehicle = nil
        result = 'denied'
        remark = ''

        if pass_number.present?
          pass = Pass.find_by(pass_number: pass_number)
          unless pass
            remark = '通行证不存在'
            return create_gate_log_and_render(nil, nil, nil, gate_name, action, result, remark)
          end

          unless pass.currently_valid?
            remark = if pass.expired?
                       '通行证已过期'
                     elsif pass.is_frozen?
                       '通行证已冻结'
                     elsif !pass.fully_approved?
                       '通行证未完成审批'
                     else
                       '通行证无效'
                     end
            return create_gate_log_and_render(pass, pass.person, pass.vehicle, gate_name, action, result, remark)
          end

          person = pass.person
          vehicle = pass.vehicle
          result = 'allowed'
          remark = '验证通过'
        elsif id_card.present?
          person = Person.find_by(id_card: id_card)
          unless person
            remark = '人员不存在'
            return create_gate_log_and_render(nil, person, nil, gate_name, action, result, remark)
          end

          if person.blacklisted?
            remark = '人员在黑名单中'
            return create_gate_log_and_render(nil, person, nil, gate_name, action, result, remark)
          end

          active_pass = person.active_passes.first
          if active_pass
            pass = active_pass
            vehicle = active_pass.vehicle
            result = 'allowed'
            remark = '身份验证通过'
          else
            remark = '无有效通行证'
          end
        elsif plate_number.present?
          vehicle = Vehicle.find_by(plate_number: plate_number)
          unless vehicle
            remark = '车辆不存在'
            return create_gate_log_and_render(nil, nil, vehicle, gate_name, action, result, remark)
          end

          if vehicle.blacklisted?
            remark = '车辆在黑名单中'
            return create_gate_log_and_render(nil, nil, vehicle, gate_name, action, result, remark)
          end

          active_pass = vehicle.passes.active.first
          if active_pass
            pass = active_pass
            person = active_pass.person
            result = 'allowed'
            remark = '车辆验证通过'
          else
            remark = '无有效通行关联'
          end
        else
          remark = '缺少验证参数'
        end

        create_gate_log_and_render(pass, person, vehicle, gate_name, action, result, remark)
      end

      def today_stats
        stats = GateLog.today_stats(params[:gate_name])
        render json: stats
      end

      private

      def gate_log_params
        params.permit(:pass_id, :person_id, :vehicle_id, :gate_name, :action, :logged_at, :result, :remark, :temperature, :id_card_verified, :photo_match_result)
      end

      def create_gate_log_and_render(pass, person, vehicle, gate_name, action, result, remark)
        gate_log = GateLog.create!(
          pass: pass,
          person: person,
          vehicle: vehicle,
          gate_name: gate_name,
          action: action,
          logged_at: Time.current,
          operator: current_user,
          result: result,
          remark: remark,
          temperature: params[:temperature],
          id_card_verified: params[:id_card_verified],
          photo_match_result: params[:photo_match_result]
        )

        render json: {
          result: result,
          remark: remark,
          gate_log: gate_log,
          pass: pass,
          person: person,
          vehicle: vehicle
        }
      end
    end
  end
end
