module Api
  module V1
    class CoursesController < BaseController
      before_action :set_course, only: %i[show update destroy publish archive]

      def index
        @courses = policy_scope(Course).ransack(params[:q]).result.order(updated_at: :desc).page(params[:page]).per(params[:per_page] || 20)
        render_paginated @courses
      end

      def show
        authorize @course
        render json: @course, include: :course_sessions
      end

      def create
        @course = Course.new(course_params)
        @course.created_by = current_user
        authorize @course

        if @course.save
          render json: @course, status: :created
        else
          render json: { errors: @course.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        authorize @course
        if @course.update(course_params)
          render json: @course
        else
          render json: { errors: @course.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        authorize @course
        @course.destroy
        head :no_content
      end

      def publish
        authorize @course
        @course.publish!
        render json: @course
      rescue AASM::InvalidTransition => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def archive
        authorize @course
        @course.archive!
        render json: @course
      rescue AASM::InvalidTransition => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      private

      def set_course
        @course = Course.find(params[:id])
      end

      def course_params
        params.require(:course).permit(:title, :description, :age_min, :age_max, :duration_minutes, :max_participants, :status)
      end
    end
  end
end
