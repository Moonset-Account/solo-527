module Admin
  class AuditLogsController < BaseController
    def index
      @versions = PaperTrail::Version.all
      @versions = @versions.where(event: params[:event]) if params[:event].present?
      @versions = @versions.where(item_type: params[:item_type]) if params[:item_type].present?
      
      if params[:whodunnit].present?
        user = User.where("name LIKE ? OR id = ?", "%#{params[:whodunnit]}%", params[:whodunnit].to_i).first
        @versions = @versions.where(whodunnit: user&.id || params[:whodunnit])
      end
      
      @versions = @versions.where("created_at >= ?", params[:start_date]) if params[:start_date].present?
      @versions = @versions.where("created_at <= ?", params[:end_date].to_date.end_of_day) if params[:end_date].present?
      
      @versions = @versions.order(created_at: :desc).page(params[:page]).per(50)
    end
  end
end
