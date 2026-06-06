module Api
  module V1
    class CoursesController < ApplicationController
      before_action :authenticate_user!, only: [:create, :update, :destroy]
      before_action :set_course, only: [:show, :update, :destroy]

      def index
        courses = Course.published
                        .by_category(params[:category])
                        .by_teacher(params[:teacher_id])
                        .order(created_at: :desc)
        render json: paginate(courses)
      end

      def show
        render json: @course, include: [:teacher, :schedules, :material_kit]
      end

      def create
        authorize Course
        @course = Course.new(course_params)
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

      private

      def set_course
        @course = Course.find(params[:id])
      end

      def course_params
        params.require(:course).permit(
          :title, :description, :category, :cover_image, :duration,
          :price, :max_students, :teacher_id, :material_kit_id, :status
        )
      end
    end
  end
end
