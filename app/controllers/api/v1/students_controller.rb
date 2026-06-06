module Api
  module V1
    class StudentsController < BaseController
      before_action :set_student, only: %i[show update destroy]

      def index
        scope = policy_scope(Student)
        scope = scope.ransack(params[:q]).result.order(created_at: :desc)
        @students = scope.page(params[:page]).per(params[:per_page] || 20)
        render_paginated @students, StudentDecorator
      end

      def show
        authorize @student
        decorated = decorate_resource(@student, StudentDecorator)
        render json: decorated
      end

      def create
        @student = Student.new(student_params)
        authorize @student

        if @student.save
          render json: @student, status: :created
        else
          render json: { errors: @student.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        authorize @student
        if @student.update(student_params)
          render json: @student
        else
          render json: { errors: @student.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        authorize @student
        @student.destroy
        head :no_content
      end

      private

      def set_student
        @student = Student.find(params[:id])
      end

      def student_params
        params.require(:student).permit(
          :name, :age, :grade, :school_id,
          :id_card_last_four, :emergency_contact_name,
          :emergency_contact_phone, :health_notes
        )
      end
    end
  end
end
