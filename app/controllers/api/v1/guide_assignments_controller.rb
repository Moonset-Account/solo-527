module Api
  module V1
    class GuideAssignmentsController < BaseController
      before_action :set_assignment, only: %i[show update destroy complete cancel]

      def index
        scope = policy_scope(GuideAssignment)
        scope = scope.ransack(params[:q]).result.order(created_at: :desc)
        scope = scope.includes(:guide, :course_session)
        @assignments = scope.page(params[:page]).per(params[:per_page] || 20)
        render_paginated @assignments
      end

      def show
        authorize @assignment
        render json: @assignment, include: %i[guide course_session]
      end

      def create
        course_session = CourseSession.find(params[:course_session_id])
        service = GuideAssignmentService.new(current_user)

        if params[:guide_ids]
          result = service.batch_assign(params[:guide_ids], course_session)
          render json: result
        else
          guide = Guide.find(params[:guide_id])
          @assignment = service.assign_guide(guide, course_session, params[:role])
          if service.success? && @assignment&.persisted?
            render json: @assignment, status: :created
          else
            render json: { errors: service.errors }, status: :unprocessable_entity
          end
        end
      end

      def available_guides
        course_session = CourseSession.find(params[:course_session_id])
        service = GuideAssignmentService.new(current_user)
        @guides = service.available_guides_for(course_session)
        decorated = decorate_collection(@guides, GuideDecorator)
        render json: decorated
      end

      def update
        authorize @assignment
        if @assignment.update(assignment_params)
          render json: @assignment
        else
          render json: { errors: @assignment.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def complete
        authorize @assignment
        @assignment.complete!
        render json: @assignment
      rescue AASM::InvalidTransition => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def cancel
        authorize @assignment
        service = GuideAssignmentService.new(current_user)
        if service.cancel_assignment(@assignment)
          render json: @assignment
        else
          render json: { errors: service.errors }, status: :unprocessable_entity
        end
      end

      def destroy
        authorize @assignment
        @assignment.destroy
        head :no_content
      end

      private

      def set_assignment
        @assignment = GuideAssignment.find(params[:id])
      end

      def assignment_params
        params.require(:guide_assignment).permit(:role, :notes, :status)
      end
    end
  end
end
