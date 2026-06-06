module Api
  module V1
    class AuditLogsController < ApplicationController
      before_action :authenticate_user!
      before_action :authorize_super_admin!

      def index
        audits = Audited::Audit.all
        audits = audits.where(user_id: params[:user_id]) if params[:user_id].present?
        audits = audits.where(auditable_type: params[:auditable_type]) if params[:auditable_type].present?
        audits = audits.where('created_at >= ?', params[:start_date]) if params[:start_date].present?
        audits = audits.where('created_at <= ?', params[:end_date]) if params[:end_date].present?
        audits = audits.order(created_at: :desc)

        render json: paginate(audits)
      end

      private

      def authorize_super_admin!
        render json: { error: 'Unauthorized' }, status: :forbidden unless current_user.super_admin?
      end
    end
  end
end
