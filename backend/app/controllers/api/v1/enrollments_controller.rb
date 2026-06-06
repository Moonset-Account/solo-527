module Api
  module V1
    class EnrollmentsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_enrollment, only: [:show, :pay, :cancel, :request_refund, :approve_refund, :reject_refund, :complete]

      def index
        enrollments = if current_user.admin?
                        Enrollment.all
                      else
                        current_user.enrollments
                      end

        enrollments = enrollments.by_status(params[:status])
                                 .by_student(params[:student_id])
                                 .by_course(params[:course_id])
                                 .by_date_range(params[:start_date], params[:end_date])
                                 .order(created_at: :desc)

        render json: paginate(enrollments, include: [:course, :schedule, :student, :material_kit])
      end

      def my
        authorize Enrollment, :my?
        enrollments = current_user.enrollments
                                  .order(created_at: :desc)
        render json: paginate(enrollments, include: [:course, :schedule, :material_kit])
      end

      def show
        authorize @enrollment
        render json: @enrollment, include: [:course, :schedule, :student, :material_kit, :work]
      end

      def create
        course = Course.find(params[:course_id])
        schedule = Schedule.find(params[:schedule_id])
        material_kit = course.material_kit

        if material_kit && material_kit.status == 'out_of_stock'
          return render json: {
            error: '材料包已售罄，暂无法报名',
            code: 'MATERIAL_OUT_OF_STOCK'
          }, status: :unprocessable_entity
        end

        if schedule.fully_booked?
          return render json: {
            error: '该排期已报满',
            code: 'SCHEDULE_FULLY_BOOKED'
          }, status: :unprocessable_entity
        end

        @enrollment = current_user.enrollments.build(
          course: course,
          schedule: schedule,
          material_kit: material_kit,
          total_amount: course.price,
          status: 'pending'
        )

        authorize @enrollment

        if @enrollment.save
          render json: @enrollment, status: :created, include: [:course, :schedule]
        else
          render json: {
            errors: @enrollment.errors.full_messages,
            code: 'VALIDATION_ERROR'
          }, status: :unprocessable_entity
        end
      end

      def pay
        authorize @enrollment

        unless @enrollment.can_pay?
          return render json: {
            error: '该订单无法支付',
            code: 'INVALID_STATUS'
          }, status: :unprocessable_entity
        end

        if @enrollment.material_kit && @enrollment.material_kit.status == 'out_of_stock'
          return render json: {
            error: '材料包已售罄，无法完成支付',
            code: 'MATERIAL_OUT_OF_STOCK'
          }, status: :unprocessable_entity
        end

        if @enrollment.pay!(params[:payment_method] || 'online')
          render json: @enrollment, include: [:course, :schedule]
        else
          render json: {
            errors: ['支付失败'],
            code: 'PAYMENT_FAILED'
          }, status: :unprocessable_entity
        end
      end

      def cancel
        authorize @enrollment

        unless @enrollment.can_cancel?
          return render json: {
            error: '该订单无法取消',
            code: 'INVALID_STATUS'
          }, status: :unprocessable_entity
        end

        if @enrollment.cancel!
          render json: @enrollment
        else
          render json: {
            errors: ['取消失败'],
            code: 'CANCEL_FAILED'
          }, status: :unprocessable_entity
        end
      end

      def request_refund
        authorize @enrollment

        unless @enrollment.can_request_refund?
          return render json: {
            error: '该订单无法申请退款',
            code: 'INVALID_STATUS'
          }, status: :unprocessable_entity
        end

        if @enrollment.request_refund!(params[:refund_reason])
          render json: @enrollment
        else
          render json: {
            errors: ['退款申请失败'],
            code: 'REFUND_REQUEST_FAILED'
          }, status: :unprocessable_entity
        end
      end

      def approve_refund
        authorize @enrollment

        unless current_user.admin?
          return render json: { error: '无权限' }, status: :forbidden
        end

        unless @enrollment.can_approve_refund?
          return render json: {
            error: '该退款申请无法审批',
            code: 'INVALID_STATUS'
          }, status: :unprocessable_entity
        end

        if @enrollment.approve_refund!
          render json: @enrollment
        else
          render json: {
            errors: ['退款审批失败'],
            code: 'REFUND_APPROVAL_FAILED'
          }, status: :unprocessable_entity
        end
      end

      def reject_refund
        authorize @enrollment

        unless current_user.admin?
          return render json: { error: '无权限' }, status: :forbidden
        end

        unless @enrollment.status == 'refund_requested'
          return render json: {
            error: '该退款申请无法拒绝',
            code: 'INVALID_STATUS'
          }, status: :unprocessable_entity
        end

        if @enrollment.reject_refund!(params[:reject_reason])
          render json: @enrollment
        else
          render json: {
            errors: ['退款拒绝失败'],
            code: 'REFUND_REJECT_FAILED'
          }, status: :unprocessable_entity
        end
      end

      def complete
        authorize @enrollment

        unless current_user.admin?
          return render json: { error: '无权限' }, status: :forbidden
        end

        unless @enrollment.can_complete?
          return render json: {
            error: '该订单无法标记完成',
            code: 'INVALID_STATUS'
          }, status: :unprocessable_entity
        end

        if @enrollment.complete!
          render json: @enrollment
        else
          render json: {
            errors: ['操作失败'],
            code: 'COMPLETE_FAILED'
          }, status: :unprocessable_entity
        end
      end

      private

      def set_enrollment
        @enrollment = Enrollment.find(params[:id])
      end
    end
  end
end
