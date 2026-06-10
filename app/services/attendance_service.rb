class AttendanceService
  def check_in(registration, checked_in_by:)
    raise "报名未审核通过" unless registration.approved?
    raise "已签到" if registration.attendance&.attended?
    registration.create_attendance!(
      checked_in_at: Time.current,
      checked_in_by: checked_in_by,
      attended: true
    )
    AuditLogService.new.log(action: "check_in", auditable: registration, user: nil, change_details: { checked_in_by: checked_in_by })
  end

  def attendance_rate(event)
    total = event.registrations.approved.count
    attended = event.registrations.joins(:attendance).where(attendances: { attended: true }).count
    return 0 if total.zero?
    (attended.to_f / total * 100).round(2)
  end

  def detect_gaps(event, schedule = nil)
    base = event.registrations.approved
    base = base.where(schedule: schedule) if schedule
    expected = base.count
    actual = base.joins(:attendance).where(attendances: { attended: true }).count
    gap = expected - actual
    if gap > 0
      alert = AttendanceAlert.find_or_create_by(event: event, schedule: schedule, status: :open)
      alert.update!(expected_count: expected, actual_count: actual, gap_count: gap)
      alert
    end
  end
end
