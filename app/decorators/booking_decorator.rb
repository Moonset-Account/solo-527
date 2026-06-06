class BookingDecorator < ApplicationDecorator
  def self.sensitive_fields
    %i[contact_phone contact_email]
  end

  def contact_phone
    mask_sensitive(object.contact_phone)
  end

  def contact_email
    mask_sensitive(object.contact_email)
  end

  def status_badge
    {
      pending: '待确认',
      confirmed: '已确认',
      cancelled: '已取消',
      rejected: '已拒绝'
    }[object.status.to_sym] || object.status
  end

  def booking_type_label
    object.school_group? ? '团体报名' : '散客报名'
  end

  def check_in_progress
    return 0 if object.student_count.zero?
    (object.checked_in_count.to_f / object.student_count * 100).round(1)
  end
end
