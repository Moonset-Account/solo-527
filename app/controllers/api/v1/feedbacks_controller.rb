module Api
  module V1
    class FeedbacksController < BaseController
      before_action :set_feedback, only: %i[show]

      def index
        scope = policy_scope(Feedback)
        scope = scope.ransack(params[:q]).result.order(created_at: :desc)
        @feedbacks = scope.page(params[:page]).per(params[:per_page] || 20)
        render_paginated @feedbacks
      end

      def show
        authorize @feedback
        render json: @feedback
      end

      def create
        @feedback = Feedback.new(feedback_params)
        @feedback.author = current_user
        authorize @feedback

        if @feedback.save
          render json: @feedback, status: :created
        else
          render json: { errors: @feedback.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_feedback
        @feedback = Feedback.find(params[:id])
      end

      def feedback_params
        params.require(:feedback).permit(:course_session_id, :booking_id, :rating, :content, :improvement_suggestions, :would_recommend)
      end
    end
  end
end
