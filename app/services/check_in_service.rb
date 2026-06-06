class CheckInService < ApplicationService
  def initialize(user = nil)
    super()
    @user = user
  end

  def check_in_student(booking_student)
    if booking_student.attended?
      add_error('该学生已签到')
      return false
    end

    booking_student.check_in!(@user)
    true
  end

  def batch_check_in(booking_student_ids)
    results = { success: 0, failed: [] }

    BookingStudent.where(id: booking_student_ids).each do |bs|
      if check_in_student(bs)
        results[:success] += 1
      else
        results[:failed] << { id: bs.id, errors: @errors.dup }
      end
      @errors.clear
    end

    results
  end

  def undo_check_in(booking_student)
    unless booking_student.attended?
      add_error('该学生未签到')
      return false
    end

    booking_student.undo_check_in!
    true
  end

  def check_in_by_code(booking_code)
    booking = Booking.find_by(id: booking_code)
    unless booking
      add_error('无效的报名编号')
      return nil
    end

    unless booking.confirmed?
      add_error('报名未确认，无法签到')
      return nil
    end

    booking
  end

  def check_in_statistics(course_session)
    total = course_session.bookings.confirmed.sum(:student_count)
    checked_in = course_session.bookings.joins(:booking_students).where(booking_students: { attended: true }).count

    {
      total: total,
      checked_in: checked_in,
      pending: total - checked_in,
      rate: total.zero? ? 0 : (checked_in.to_f / total * 100).round(1)
    }
  end
end
