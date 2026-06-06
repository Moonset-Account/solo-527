class BookingService < ApplicationService
  def initialize(user = nil)
    super()
    @user = user
  end

  def create_group_booking(params)
    booking = nil
    ActiveRecord::Base.transaction do
      booking = Booking.new(params)
      booking.booking_type = :school_group
      booking.created_by = @user
      booking.status = :pending

      unless booking.valid?
        add_errors_from(booking)
        raise ActiveRecord::Rollback
      end

      course_session = booking.course_session
      unless course_session&.has_capacity?(booking.student_count)
        add_error("场次名额不足，剩余 #{course_session&.available_slots || 0} 个名额")
        raise ActiveRecord::Rollback
      end

      booking.save!

      if params[:student_ids].present?
        params[:student_ids].each do |student_id|
          student = Student.find_by(id: student_id)
          booking.add_student(student) if student
        end
      end
    end
    booking
  end

  def create_individual_booking(params)
    booking = nil
    ActiveRecord::Base.transaction do
      booking = Booking.new(params)
      booking.booking_type = :individual
      booking.created_by = @user
      booking.status = :pending

      unless booking.valid?
        add_errors_from(booking)
        raise ActiveRecord::Rollback
      end

      course_session = booking.course_session
      unless course_session&.has_capacity?(booking.student_count)
        add_error("场次名额不足")
        raise ActiveRecord::Rollback
      end

      booking.save!

      if params[:students_attributes].present?
        params[:students_attributes].each do |student_attrs|
          student = Student.create!(student_attrs)
          booking.add_student(student)
        end
      end
    end
    booking
  end

  def confirm_booking(booking)
    unless booking.pending?
      add_error('只有待确认状态的报名可以确认')
      return false
    end

    unless booking.course_session.has_capacity?(booking.student_count)
      add_error('场次名额不足')
      return false
    end

    booking.confirm!
    true
  rescue AASM::InvalidTransition => e
    add_error(e.message)
    false
  end

  def cancel_booking(booking, reason = nil)
    booking.cancel_reason = reason
    booking.cancelled_by = @user
    booking.cancel!
    true
  rescue AASM::InvalidTransition => e
    add_error(e.message)
    false
  end
end
