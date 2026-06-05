module Mobile
  class CheckInsController < ApplicationController
    skip_before_action :authenticate_user!, only: [:new, :create, :sync]
    layout 'mobile'

    def new
      @session = Session.find_by!(qr_code_token: params[:qr_token])
      @registrations = @session.registrations.approved.includes(:school, :students)
    end

    def create
      @session = Session.find_by!(qr_code_token: params[:qr_token])
      registration = @session.registrations.find_by(id: params[:registration_id])

      unless registration&.approved?
        render json: { error: '报名无效或未审核通过' }, status: :unprocessable_entity
        return
      end

      student = registration.students.find_by(id: params[:student_id])
      unless student
        render json: { error: '学生不存在' }, status: :unprocessable_entity
        return
      end

      if @session.student_already_checked_in?(student)
        render json: { error: '该学生已签到' }, status: :unprocessable_entity
        return
      end

      check_in = @session.check_ins.build(
        registration: registration,
        student: student,
        checked_in_by: current_user || User.find_by(email: 'system@museum.com'),
        checked_in_at: Time.current,
        check_in_method: params[:check_in_method] || 'qr',
        status: :confirmed,
        offline_uuid: params[:offline_uuid]
      )

      if params[:photo].present?
        check_in.photo.attach(params[:photo])
      end

      if check_in.save
        check_in.update(synced_at: Time.current) unless params[:offline_uuid].present?
        render json: { success: true, check_in_id: check_in.id }
      else
        render json: { error: check_in.errors.full_messages.join(', ') }, status: :unprocessable_entity
      end
    end

    def sync
      if params[:check_ins].present?
        params[:check_ins].each do |check_in_data|
          existing = CheckIn.find_by(offline_uuid: check_in_data[:offline_uuid])
          next if existing&.synced?

          check_in = existing || CheckIn.new
          check_in.assign_attributes(
            registration_id: check_in_data[:registration_id],
            student_id: check_in_data[:student_id],
            session_id: check_in_data[:session_id],
            checked_in_by_id: check_in_data[:checked_in_by_id],
            checked_in_at: check_in_data[:checked_in_at],
            check_in_method: check_in_data[:check_in_method] || 'offline',
            status: :confirmed,
            offline_uuid: check_in_data[:offline_uuid],
            synced_at: Time.current
          )
          check_in.save
        end
        render json: { success: true, synced_count: params[:check_ins].size }
      else
        render json: { error: '没有数据需要同步' }, status: :unprocessable_entity
      end
    end

    def index
      @check_ins = current_user.check_ins.order(checked_in_at: :desc).limit(50)
    end

    def show
      @check_in = CheckIn.find(params[:id])
    end
  end
end
