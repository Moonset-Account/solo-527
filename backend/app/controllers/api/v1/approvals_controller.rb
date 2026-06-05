module Api
  module V1
    class ApprovalsController < ApplicationController
      def index
        scope = Approval.all.includes(:pass, :approver)
        scope = scope.pending if params[:pending].present? && params[:pending] == 'true'
        scope = scope.by_level(params[:level]) if params[:level].present?
        scope = scope.order(created_at: :desc)
        render_paginated(scope)
      end

      def pending_for_me
        scope = Approval.pending.includes(:pass => :person)
        if params[:level].present?
          scope = scope.by_level(params[:level])
        end
        scope = scope.order(created_at: :desc)
        render_paginated(scope)
      end

      def approve
        authorize_approve!
        approval = Approval.find(params[:id])

        if approval.status != 'pending'
          return render json: { error: '该审批已处理' }, status: :unprocessable_entity
        end

        ActiveRecord::Base.transaction do
          approval.approve!(current_user, params[:comment])

          pass = approval.pass
          if pass.fully_approved? && pass.pending?
            pass.approve!
            NotificationJob.perform_later(pass, 'pass_approved', current_user)
          end
        end

        render json: { message: '审批通过', approval: approval }
      end

      def reject
        authorize_approve!
        approval = Approval.find(params[:id])

        if approval.status != 'pending'
          return render json: { error: '该审批已处理' }, status: :unprocessable_entity
        end

        ActiveRecord::Base.transaction do
          approval.reject!(current_user, params[:comment])

          pass = approval.pass
          if pass.pending?
            pass.reject!
            NotificationJob.perform_later(pass, 'pass_rejected', current_user)
          end
        end

        render json: { message: '审批拒绝', approval: approval }
      end
    end
  end
end
