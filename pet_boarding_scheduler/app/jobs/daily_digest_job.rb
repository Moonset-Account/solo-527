class DailyDigestJob
  include Sidekiq::Job

  def perform
    today = Date.today

    stats = {
      check_ins: BoardingReservation.where("DATE(check_in_at) = ?", today).count,
      check_outs: BoardingReservation.where("DATE(check_out_at) = ?", today).count,
      health_checks: HealthRecord.where("DATE(recorded_at) = ?", today).count,
      trainings: TrainingRecord.where(training_date: today).count,
      safety_incidents: SafetyIncident.where("DATE(occurred_at) = ?", today).count
    }

    Notification.create!(
      title: "每日数据汇总 - #{today}",
      content: "入住: #{stats[:check_ins]}, 离店: #{stats[:check_outs]}, 健康检查: #{stats[:health_checks]}, 训练: #{stats[:trainings]}, 安全事件: #{stats[:safety_incidents]}",
      notification_type: "system"
    )
  end
end
