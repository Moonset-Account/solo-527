class Bookings::CreateService < ApplicationService
  def call
    return error('学员信息不存在') unless current_user.student
    return error('课程安排不存在') unless course_session
    return error('课程已满') unless course_session.has_available_slots?
    return error('该学员已报名此课程') if already_booked?

    if course_session.material_package && !course_session.material_available?
      return error('材料包库存不足')
    end

    result = nil

    ActiveRecord::Base.transaction do
      @booking = build_booking

      if course_session.material_package
        course_session.material_package.reserve!(1)
      end

      course_session.increment!(:registered_count)

      if @booking.save
        log_audit('create', @booking, {}, @booking.attributes)
        create_notifications
        result = success(@booking)
      else
        raise ActiveRecord::Rollback
      end
    end

    result || error(@booking&.errors&.full_messages || ['报名失败'])
  rescue StandardError => e
    error(e.message)
  end

  private

  def course_session
    @course_session ||= CourseSession.find_by(id: params[:course_session_id])
  end

  def already_booked?
    Booking.exists?(
      student_id: current_user.student.id,
      course_session_id: course_session.id,
      status: [:pending, :approved, :paid]
    )
  end

  def build_booking
    Booking.new(
      student: current_user.student,
      course_session: course_session,
      material_package: course_session.material_package,
      course_fee: course_session.course.price,
      material_fee: course_session.material_package&.sale_price || 0,
      status: course_session.course.requires_approval ? :pending : :approved,
      payment_status: :unpaid,
      attendance_status: :not_checked_in,
      notes: params[:notes]
    )
  end

  def create_notifications
    if @booking.pending?
      send_notification(
        User.where(role: [:admin, :super_admin]).first,
        '新报名待审批',
        "#{current_user.name} 报名了 #{course_session.course.title}，请及时审批",
        'booking_pending',
        booking_id: @booking.id
      )
    end

    send_notification(
      current_user,
      '报名成功',
      "您已成功报名 #{course_session.course.title}，请按时上课",
      'booking_created',
      booking_id: @booking.id
    )
  end
end
