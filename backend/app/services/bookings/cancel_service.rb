class Bookings::CancelService < ApplicationService
  def call
    return error('报名不存在') unless booking
    return error('无法取消该报名') unless booking.can_cancel?
    return error('无权限取消该报名') unless can_cancel?

    result = nil

    ActiveRecord::Base.transaction do
      old_status = booking.status
      booking.update!(
        status: :cancelled,
        cancelled_at: Time.current,
        cancel_reason: params[:cancel_reason]
      )

      booking.course_session.decrement!(:registered_count)

      if booking.material_package
        booking.material_package.release!(1)
      end

      log_audit('cancel', booking, { status: old_status }, booking.attributes)

      send_notification(
        booking.student.user,
        '报名已取消',
        "您的 #{booking.course_session.course.title} 报名已取消",
        'booking_cancelled',
        booking_id: booking.id
      )

      result = success(booking)
    end

    result
  rescue StandardError => e
    error(e.message)
  end

  private

  def booking
    @booking ||= Booking.find_by(id: params[:id])
  end

  def can_cancel?
    current_user.admin? || booking.student.user_id == current_user.id
  end
end
