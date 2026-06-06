module Api
  module V1
    class CourseSessionsController < BaseController
      before_action :set_course_session, only: %i[show update destroy start complete cancel]
      before_action :set_course, only: %i[index create]

      def index
        scope = @course ? @course.course_sessions : CourseSession.all
        scope = policy_scope(scope)
        scope = scope.ransack(params[:q]).result.order(start_time: :desc)
        @course_sessions = scope.page(params[:page]).per(params[:per_page] || 20)
        render_paginated @course_sessions
      end

      def show
        authorize @course_session
        render json: @course_session, include: %i[course guides bookings guide_assignments]
      end

      def create
        @course_session = @course.course_sessions.new(course_session_params)
        authorize @course_session

        if @course_session.save
          render json: @course_session, status: :created
        else
          render json: { errors: @course_session.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        authorize @course_session
        if @course_session.update(course_session_params)
          render json: @course_session
        else
          render json: { errors: @course_session.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        authorize @course_session
        @course_session.destroy
        head :no_content
      end

      def start
        authorize @course_session
        @course_session.start!
        render json: @course_session
      rescue AASM::InvalidTransition => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def complete
        authorize @course_session
        @course_session.complete!
        render json: @course_session
      rescue AASM::InvalidTransition => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def cancel
        authorize @course_session
        @course_session.cancel!
        render json: @course_session
      rescue AASM::InvalidTransition => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      private

      def set_course_session
        @course_session = CourseSession.find(params[:id])
      end

      def set_course
        @course = Course.find(params[:course_id]) if params[:course_id]
      end

      def course_session_params
        params.require(:course_session).permit(:start_time, :end_time, :location, :max_participants, :notes)
      end
    end
  end
end
