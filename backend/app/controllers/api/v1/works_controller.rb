module Api
  module V1
    class WorksController < ApplicationController
      before_action :authenticate_user!, only: [:create, :update, :authorize_public, :approve, :reject, :my]
      before_action :set_work, only: [:show, :update, :authorize_public, :approve, :reject]

      def index
        works = if params[:public] == 'true'
                  Work.where(is_public: true, review_status: 'approved')
                elsif current_user&.admin?
                  Work.all
                elsif current_user
                  current_user.works
                else
                  Work.where(is_public: true, review_status: 'approved')
                end

        works = works.by_student(params[:student_id])
                     .by_course(params[:course_id])
                     .by_review_status(params[:review_status])
                     .order(created_at: :desc)

        render json: paginate(works, include: [:student, :course])
      end

      def my
        authorize Work, :my?
        works = current_user.works.order(created_at: :desc)
        render json: paginate(works, include: [:course])
      end

      def show
        render json: @work, include: [:student, :course, :reviews]
      end

      def create
        @work = current_user.works.build(work_params)
        @work.review_status = 'pending'
        @work.is_public = false unless params[:work][:is_public] == true

        if @work.save
          render json: @work, status: :created
        else
          render json: {
            errors: @work.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      def update
        authorize_work_action @work

        if @work.update(work_params)
          render json: @work
        else
          render json: {
            errors: @work.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      def authorize_public
        authorize @work, :authorize_public?

        if @work.authorize_public!(current_user)
          render json: @work
        else
          render json: {
            errors: ['授权失败']
          }, status: :unprocessable_entity
        end
      end

      def approve
        authorize @work, :approve?

        if @work.approve!(current_user)
          render json: @work
        else
          render json: {
            errors: ['审核失败']
          }, status: :unprocessable_entity
        end
      end

      def reject
        authorize @work, :reject?

        if @work.reject!(current_user, params[:reject_reason])
          render json: @work
        else
          render json: {
            errors: ['拒绝失败']
          }, status: :unprocessable_entity
        end
      end

      private

      def set_work
        @work = Work.find(params[:id])
      end

      def work_params
        params.require(:work).permit(
          :title, :description, :course_id, :enrollment_id,
          :is_public, images: []
        )
      end
    end
  end
end
