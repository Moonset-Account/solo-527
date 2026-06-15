module Admin
  module Analytics
    class IndexController < ApplicationController
      def index
        redirect_to service_quality_admin_analytics_index_path
      end

      def service_quality
        @start_date = params[:start_date]&.to_date || 30.days.ago.to_date
        @end_date = params[:end_date]&.to_date || Date.today
        @caretaker_id = params[:caretaker_id]

        base_scope = BoardingReservation.where("check_in_at >= ? AND check_in_at <= ?", @start_date, @end_date)
        base_scope = base_scope.where(caretaker_id: @caretaker_id) if @caretaker_id.present?

        @by_caretaker = base_scope.group(:caretaker_id)
                                  .select("caretaker_id, COUNT(*) as total, AVG(total_price) as avg_price")
                                  .includes(:caretaker)

        @by_date = base_scope.group("DATE(check_in_at)")
                             .order("date_check_in_at desc")
                             .count

        @total_boarding = base_scope.count
        @total_revenue = base_scope.sum(:total_price)
        @avg_stay_days = base_scope.average("EXTRACT(EPOCH FROM (check_out_at - check_in_at)) / 86400").to_f.round(2)

        training_scope = TrainingRecord.where("training_date >= ? AND training_date <= ?", @start_date, @end_date)
        training_scope = training_scope.where(caretaker_id: @caretaker_id) if @caretaker_id.present?

        @total_training = training_scope.count
        @delayed_training = training_scope.delayed.count
        @delay_rate = @total_training > 0 ? (@delayed_training.to_f / @total_training * 100).round(2) : 0

        @caretakers = Caretaker.active.order(:name)
      end

      def safety_trends
        @start_date = params[:start_date]&.to_date || 30.days.ago.to_date
        @end_date = params[:end_date]&.to_date || Date.today
        @severity = params[:severity]

        base_scope = SafetyIncident.where("occurred_at >= ? AND occurred_at <= ?", @start_date, @end_date)
        base_scope = base_scope.where(severity: params[:severity]) if params[:severity].present?

        @total_incidents = base_scope.count
        @unresolved = base_scope.unresolved.count
        @by_type = base_scope.group(:incident_type).count
        @by_severity = base_scope.group(:severity).count

        @by_date = base_scope.group("DATE(occurred_at)")
                             .order("date_occurred_at desc")
                             .count

        @recent_incidents = base_scope.includes(:pet, :caretaker)
                                      .order(occurred_at: :desc)
                                      .limit(10)
      end

      def training_delays
        @start_date = params[:start_date]&.to_date || 30.days.ago.to_date
        @end_date = params[:end_date]&.to_date || Date.today
        @caretaker_id = params[:caretaker_id]

        base_scope = TrainingRecord.where("training_date >= ? AND training_date <= ?", @start_date, @end_date)
        base_scope = base_scope.where(caretaker_id: @caretaker_id) if @caretaker_id.present?

        scope = base_scope.delayed.includes(:pet, :caretaker, :service).order(training_date: :desc)
        @pagy_delayed, @delayed_records = pagy(scope, page: params[:page])

        @by_reason = base_scope.delayed.group(:delay_reason).count
        @by_caretaker = base_scope.delayed.group(:caretaker_id)
                                       .select("caretaker_id, COUNT(*) as count")
                                       .includes(:caretaker)

        @total_delayed = base_scope.delayed.count
        @total_training = base_scope.count
        @delay_rate = @total_training > 0 ? (@total_delayed.to_f / @total_training * 100).round(2) : 0

        @caretakers = Caretaker.active.order(:name)
      end
    end
  end
end
