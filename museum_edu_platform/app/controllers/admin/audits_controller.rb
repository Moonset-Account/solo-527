module Admin
  class AuditsController < BaseController
    def index
      authorize AuditLog, :index? if defined?(AuditLog)
      @versions = PaperTrail::Version.includes(:item).order(created_at: :desc)
        .page(params[:page]).per(50)

      if params[:item_type].present?
        @versions = @versions.where(item_type: params[:item_type])
      end

      if params[:whodunnit].present?
        @versions = @versions.where(whodunnit: params[:whodunnit])
      end
    end
  end
end
