module Api
  module V1
    class BookingsController < BaseController
      before_action :set_booking, only: %i[show update destroy confirm cancel students check_in]

      def index
        scope = policy_scope(Booking)
        scope = scope.ransack(params[:q]).result.order(created_at: :desc)
        @bookings = scope.page(params[:page]).per(params[:per_page] || 20)
        render_paginated @bookings, BookingDecorator
      end

      def show
        authorize @booking
        decorated = decorate_resource(@booking, BookingDecorator)
        render json: decorated
      end

      def create
        service = BookingService.new(current_user)
        if params[:booking][:booking_type] == 'group'
          @booking = service.create_group_booking(booking_params)
        else
          @booking = service.create_individual_booking(booking_params)
        end

        if service.success? && @booking&.persisted?
          render json: @booking, status: :created
        else
          render json: { errors: service.errors.presence || @booking&.errors&.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        authorize @booking
        if @booking.update(booking_params)
          render json: @booking
        else
          render json: { errors: @booking.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        authorize @booking
        @booking.destroy
        head :no_content
      end

      def confirm
        authorize @booking, :confirm?
        service = BookingService.new(current_user)
        if service.confirm_booking(@booking)
          render json: @booking
        else
          render json: { errors: service.errors }, status: :unprocessable_entity
        end
      end

      def cancel
        authorize @booking, :cancel?
        service = BookingService.new(current_user)
        if service.cancel_booking(@booking, params[:reason])
          render json: @booking
        else
          render json: { errors: service.errors }, status: :unprocessable_entity
        end
      end

      def students
        authorize @booking
        @booking_students = @booking.booking_students.includes(:student)
        decorated = @booking_students.map do |bs|
          {
            id: bs.id,
            student: StudentDecorator.new(bs.student, current_user: current_user),
            attended: bs.attended,
            checked_in_at: bs.checked_in_at
          }
        end
        render json: decorated
      end

      def check_in
        authorize @booking, :check_in?
        service = CheckInService.new(current_user)

        if params[:booking_student_id]
          bs = @booking.booking_students.find(params[:booking_student_id])
          if service.check_in_student(bs)
            render json: { message: '签到成功' }
          else
            render json: { errors: service.errors }, status: :unprocessable_entity
          end
        elsif params[:booking_student_ids]
          result = service.batch_check_in(params[:booking_student_ids])
          render json: result
        end
      end

      private

      def set_booking
        @booking = Booking.find(params[:id])
      end

      def booking_params
        params.require(:booking).permit(
          :course_session_id, :school_id, :booking_type,
          :contact_name, :contact_phone, :contact_email,
          :student_count, :teacher_count, :special_requirements,
          student_ids: [],
          students_attributes: %i[name age grade school_id id_card_last_four emergency_contact_name emergency_contact_phone health_notes]
        )
      end
    end
  end
end
