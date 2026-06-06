module Api
  module V1
    class GuidesController < BaseController
      before_action :set_guide, only: %i[show update destroy assignments schedule]

      def index
        scope = policy_scope(Guide)
        scope = scope.ransack(params[:q]).result.order(created_at: :desc)
        @guides = scope.page(params[:page]).per(params[:per_page] || 20)
        render_paginated @guides, GuideDecorator
      end

      def show
        authorize @guide
        decorated = decorate_resource(@guide, GuideDecorator)
        render json: decorated
      end

      def create
        @guide = Guide.new(guide_params)
        authorize @guide

        if @guide.save
          render json: @guide, status: :created
        else
          render json: { errors: @guide.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        authorize @guide
        if @guide.update(guide_params)
          render json: @guide
        else
          render json: { errors: @guide.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        authorize @guide
        @guide.destroy
        head :no_content
      end

      def assignments
        authorize @guide
        start_date = params[:start_date] ? Date.parse(params[:start_date]) : 30.days.ago
        end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today
        service = GuideAssignmentService.new(current_user)
        @assignments = service.guide_schedule(@guide, start_date, end_date)
        render json: @assignments
      end

      def schedule
        authorize @guide
        start_date = params[:start_date] ? Date.parse(params[:start_date]) : Date.today
        end_date = params[:end_date] ? Date.parse(params[:end_date]) : 30.days.from_now
        service = GuideAssignmentService.new(current_user)
        @assignments = service.guide_schedule(@guide, start_date, end_date)
        render json: @assignments
      end

      private

      def set_guide
        @guide = Guide.find(params[:id])
      end

      def guide_params
        params.require(:guide).permit(:name, :phone, :email, :employee_id, :specialties, :status)
      end
    end
  end
end
