module Admin
  class DashboardController < ApplicationController
    def index
      @current_boardings = BoardingReservation.current.includes(:pet, :caretaker, :kennel).order(check_in_at: :desc)
      @today_health_records = HealthRecord.where("DATE(recorded_at) = ?", Date.today)
                                          .includes(:pet, :caretaker)
                                          .order(recorded_at: :desc)
      @today_training_records = TrainingRecord.today.includes(:pet, :caretaker, :service)
                                              .order(training_date: :desc)
      @kennels = Kennel.all.order(:name)
      @notifications = Notification.unread.order(created_at: :desc).limit(10)

      @health_changes = calculate_health_changes
      @scheduled_trainings = TrainingRecord.scheduled.today.includes(:pet, :caretaker, :service)
      @delayed_trainings = TrainingRecord.delayed.includes(:pet, :caretaker, :service)
                                          .where("training_date >= ?", 3.days.ago)
                                          .order(training_date: :desc)
      @upcoming_checkouts = BoardingReservation.checked_in.where("DATE(check_out_at) <= ?", 2.days.from_now)
                                                .includes(:pet, :caretaker, :kennel)
                                                .order(check_out_at: :asc)

      @stats = {
        total_pets: Pet.active.count,
        current_boardings: BoardingReservation.current.count,
        available_kennels: Kennel.available.count,
        active_caretakers: Caretaker.active.count,
        today_health_checks: @today_health_records.count,
        today_trainings: @today_training_records.count,
        scheduled_trainings_count: @scheduled_trainings.count,
        delayed_trainings_count: @delayed_trainings.count,
        safety_incidents_month: SafetyIncident.recent(30).count,
        unresolved_incidents: SafetyIncident.unresolved.count,
        unread_notifications: Notification.unread.count,
        upcoming_checkouts_count: @upcoming_checkouts.count
      }
    end

    private

    def calculate_health_changes
      pets_with_recent_records = Pet.active.joins(:health_records)
                                    .where("health_records.recorded_at >= ?", 3.days.ago)
                                    .distinct

      changes = []
      pets_with_recent_records.each do |pet|
        records = pet.health_records.order(recorded_at: :desc).limit(2)
        next if records.size < 2

        latest = records[0]
        previous = records[1]

        appetite_change = (latest.appetite_level || 0) - (previous.appetite_level || 0)
        activity_change = (latest.activity_level || 0) - (previous.activity_level || 0)
        weight_change = latest.weight_change

        significant_weight = weight_change && weight_change.abs >= 0.5
        if appetite_change.abs >= 2 || activity_change.abs >= 2 || significant_weight
          changes << {
            pet:,
            latest_record: latest,
            appetite_change:,
            activity_change:,
            weight_change:,
            status: determine_health_status(appetite_change, activity_change, weight_change)
          }
        end
      end

      changes.sort_by { |c| c[:status][:priority] }
    end

    def determine_health_status(appetite_change, activity_change, weight_change)
      score = appetite_change.abs + activity_change.abs
      score += 2 if weight_change && weight_change.abs >= 1
      score += 1 if weight_change && weight_change.abs.between?(0.5, 0.99)

      is_negative = appetite_change < 0 || activity_change < 0 || (weight_change && weight_change < 0)

      if score >= 3 && is_negative
        { label: "显著下降", color: "bg-red-100 text-red-700 border-red-200", icon: "🔴", priority: 1 }
      elsif score >= 2 && is_negative
        { label: "轻微下降", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: "🟡", priority: 2 }
      elsif score >= 2
        { label: "明显改善", color: "bg-green-100 text-green-700 border-green-200", icon: "🟢", priority: 4 }
      else
        { label: "略有变化", color: "bg-blue-100 text-blue-700 border-blue-200", icon: "🔵", priority: 3 }
      end
    end
  end
end
