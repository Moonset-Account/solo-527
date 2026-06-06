class GuideDecorator < ApplicationDecorator
  def self.sensitive_fields
    %i[phone email employee_id]
  end

  def phone
    mask_sensitive(object.phone)
  end

  def email
    mask_sensitive(object.email)
  end

  def employee_id
    mask_sensitive(object.employee_id)
  end

  def status_label
    {
      active: '在职',
      on_leave: '休假',
      inactive: '离职'
    }[object.status.to_sym] || object.status
  end

  def upcoming_sessions_count
    object.assigned_sessions.count
  end

  def utilization_rate(days = 30)
    total_days = days.to_f
    working_days = object.course_sessions
                         .where(start_time: days.days.ago..Time.current)
                         .select("DATE(start_time)")
                         .distinct
                         .count
    (working_days / total_days * 100).round(1)
  end
end
