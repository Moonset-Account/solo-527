require 'test_helper'

class CheckInServiceTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(name: 'Checkin Test', email: 'checkin_test@test.com', password: 'password123', role: :education_teacher)
    @school = School.create!(name: 'Checkin Test School')
    @course = Course.create!(title: 'Checkin Test Course', age_min: 6, age_max: 12, duration_minutes: 90, max_participants: 30)
    @session = CourseSession.create!(
      course: @course,
      start_time: 1.day.from_now.change(hour: 9, min: 0, sec: 0),
      end_time: 1.day.from_now.change(hour: 11, min: 0, sec: 0),
      max_participants: 30
    )
    @student = Student.create!(name: 'Student', age: 10, school: @school)
    @booking = Booking.create!(
      course_session: @session,
      school: @school,
      booking_type: :school_group,
      contact_name: 'Contact',
      contact_phone: '13800138000',
      student_count: 1,
      status: :confirmed,
      created_by: @user
    )
    @booking_student = @booking.booking_students.create!(student: @student)
    @service = CheckInService.new(@user)
  end

  test 'check in student successfully' do
    assert_not @booking_student.attended?
    result = @service.check_in_student(@booking_student)
    assert result
    @booking_student.reload
    assert @booking_student.attended?
    assert @booking_student.checked_in_at.present?
    assert_equal @user, @booking_student.checked_in_by
  end

  test 'cannot check in already checked in student' do
    @booking_student.update!(attended: true)
    result = @service.check_in_student(@booking_student)
    assert_not result
    assert_includes @service.errors, '该学生已签到'
  end

  test 'undo check in' do
    @booking_student.update!(attended: true, checked_in_at: Time.current, checked_in_by: @user)
    result = @service.undo_check_in(@booking_student)
    assert result
    @booking_student.reload
    assert_not @booking_student.attended?
    assert_nil @booking_student.checked_in_at
  end

  test 'batch check in' do
    student2 = Student.create!(name: 'Student 2', age: 11, school: @school)
    bs2 = @booking.booking_students.create!(student: student2)

    result = @service.batch_check_in([@booking_student.id, bs2.id])
    assert_equal 2, result[:success]
    assert_empty result[:failed]
  end

  test 'check in statistics' do
    @booking_student.update!(attended: true)

    stats = @service.check_in_statistics(@session)
    assert_equal 1, stats[:total]
    assert_equal 1, stats[:checked_in]
    assert_equal 0, stats[:pending]
    assert_equal 100.0, stats[:rate]
  end
end
