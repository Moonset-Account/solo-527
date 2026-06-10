class AlertService
  def close_alert(alert, close_note:, user:)
    raise "告警已关闭" unless alert.open?
    alert.update!(status: :closed, closed_at: Time.current, close_note: close_note)
    AuditLogService.new.log(action: "alert_closed", auditable: alert, user: user, change_details: { close_note: close_note })
  end

  def quality_after_close(alert)
    event = alert.event
    {
      before_rate: calculate_rate_before(event, alert.closed_at),
      after_rate: calculate_rate_after(event, alert.closed_at),
      gap_reduction: alert.gap_count
    }
  end

  private

  def calculate_rate_before(event, closed_at)
    total = event.registrations.approved.where("reviewed_at < ?", closed_at).count
    attended = event.registrations.approved.joins(:attendance).where(attendances: { attended: true }).where("attendances.checked_in_at < ?", closed_at).count
    return 0 if total.zero?
    (attended.to_f / total * 100).round(2)
  end

  def calculate_rate_after(event, closed_at)
    total = event.registrations.approved.where("reviewed_at >= ?", closed_at).count
    attended = event.registrations.approved.joins(:attendance).where(attendances: { attended: true }).where("attendances.checked_in_at >= ?", closed_at).count
    return 0 if total.zero?
    (attended.to_f / total * 100).round(2)
  end
end
