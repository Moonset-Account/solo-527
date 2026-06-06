module Api
  module V1
    class SchoolsController < BaseController
      before_action :set_school, only: %i[show update destroy]

      def index
        @schools = policy_scope(School).ransack(params[:q]).result.order(created_at: :desc).page(params[:page]).per(params[:per_page] || 20)
        render_paginated @schools
      end

      def show
        authorize @school
        render json: @school, include: :students
      end

      def create
        @school = School.new(school_params)
        authorize @school

        if @school.save
          render json: @school, status: :created
        else
          render json: { errors: @school.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        authorize @school
        if @school.update(school_params)
          render json: @school
        else
          render json: { errors: @school.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        authorize @school
        @school.destroy
        head :no_content
      end

      private

      def set_school
        @school = School.find(params[:id])
      end

      def school_params
        params.require(:school).permit(:name, :contact_person, :phone, :email, :address, :status)
      end
    end
  end
end
