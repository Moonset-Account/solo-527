module Api
  module V1
    class TeachingAidsController < BaseController
      before_action :set_teaching_aid, only: %i[show update destroy allocate return]

      def index
        @teaching_aids = policy_scope(TeachingAid).ransack(params[:q]).result.order(created_at: :desc).page(params[:page]).per(params[:per_page] || 20)
        render_paginated @teaching_aids
      end

      def show
        authorize @teaching_aid
        render json: @teaching_aid, include: :course_sessions
      end

      def create
        @teaching_aid = TeachingAid.new(teaching_aid_params)
        authorize @teaching_aid

        if @teaching_aid.save
          render json: @teaching_aid, status: :created
        else
          render json: { errors: @teaching_aid.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        authorize @teaching_aid
        if @teaching_aid.update(teaching_aid_params)
          render json: @teaching_aid
        else
          render json: { errors: @teaching_aid.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        authorize @teaching_aid
        @teaching_aid.destroy
        head :no_content
      end

      def allocate
        authorize @teaching_aid
        course_session = CourseSession.find(params[:course_session_id])
        quantity = params[:quantity] || 1

        allocation = TeachingAidAllocation.new(
          teaching_aid: @teaching_aid,
          course_session: course_session,
          quantity: quantity,
          allocated_by: current_user
        )

        if allocation.save
          render json: allocation, status: :created
        else
          render json: { errors: allocation.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def return_aid
        authorize @teaching_aid
        allocation = TeachingAidAllocation.find(params[:allocation_id])
        if allocation.return!(current_user)
          render json: { message: '归还成功' }
        else
          render json: { errors: ['归还失败'] }, status: :unprocessable_entity
        end
      end

      private

      def set_teaching_aid
        @teaching_aid = TeachingAid.find(params[:id])
      end

      def teaching_aid_params
        params.require(:teaching_aid).permit(:name, :category, :total_quantity, :available_quantity, :description, :location)
      end
    end
  end
end
