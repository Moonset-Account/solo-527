class Bookings::ApproveService < ApplicationService
  def call
    return error('报名不存在') unless booking
    return error('只有待审批的报名可以审批') unless booking.pending?
    return error('无权限审批') unless current_user.admin?

    result = nil

    ActiveRecord::Base.transaction do
      booking.update!(
        status: :approved,
        approved_by: current_user,
        approved_at: Time.current
      )

      log_audit('approve', booking, { status: 'pending' }, booking.attributes)

      send_notification(
        booking.student.user,
        '报名已通过',
        "您的 #{booking.course_session.course.title} 报名已通过审批，请及时完成支付",
        'booking_approved',
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
end
