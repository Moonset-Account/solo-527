module Api
  module V1
    class DashboardController < BaseController
      def overview
        service = DashboardService.new(params, current_user)
        render json: {
          stats: service.overview_stats,
          sessions_by_status: service.sessions_by_status,
          bookings_by_type: service.bookings_by_type,
          bookings_by_status: service.bookings_by_status
        }
      end

      def guide_utilization
        days = params[:days]&.to_i || 30
        service = DashboardService.new(params, current_user)
        render json: service.guide_utilization(days)
      end

      def session_occupancy
        start_date = params[:start_date] ? Date.parse(params[:start_date]) : 30.days.ago.to_date
        end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today
        service = DashboardService.new(params, current_user)
        render json: service.session_occupancy_rate(start_date, end_date)
      end

      def bottlenecks
        service = DashboardService.new(params, current_user)
        data = service.bottleneck_analysis
        render json: data
      end

      def exports
        authorize :dashboard, :export?
        export_type = params[:type] || params[:export_type]
        filters = params[:filters] || params.to_unsafe_h.slice(:start_date, :end_date, :status, :school_id, :responsible_id, :guide_id)

        @export = Export.create!(
          user: current_user,
          export_type: export_type,
          filters: filters
        )
        ExportJob.perform_later(@export.id)

        render json: {
          message: '导出任务已开始，完成后将可下载',
          export: @export.as_json(methods: [:download_url])
        }, status: :created
      end
    end
  end
end
