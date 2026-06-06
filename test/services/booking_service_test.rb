require 'test_helper'

class BookingServiceTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(name: 'Booking Test', email: 'booking_test@test.com', password: 'password123', role: :education_teacher)
    @school = School.create!(name: 'Booking Test School')
    @course = Course.create!(title: 'Booking Test Course', age_min: 6, age_max: 12, duration_minutes: 90, max_participants: 30)
    @session = CourseSession.create!(
      course: @course,
      start_time: 1.day.from_now.change(hour: 9, min: 0, sec: 0),
      end_time: 1.day.from_now.change(hour: 11, min: 0, sec: 0),
      max_participants: 30
    )
    @service = BookingService.new(@user)
  end

  test 'create group booking should require school' do
    booking = @service.create_group_booking(
      course_session_id: @session.id,
      contact_name: 'Contact',
      contact_phone: '13800138000',
      student_count: 10
    )

    assert_not booking.persisted?
    assert @service.errors.any? { |e| e.include?('团体报名必须指定学校') }
  end

  test 'create group booking with valid data' do
    booking = @service.create_group_booking(
      course_session_id: @session.id,
      school_id: @school.id,
      contact_name: 'Contact',
      contact_phone: '13800138000',
      student_count: 10
    )

    assert booking.persisted?
    assert booking.school_group?
    assert booking.pending?
    assert_equal @user, booking.created_by
  end

  test 'should not create booking when capacity exceeded' do
    booking = @service.create_group_booking(
      course_session_id: @session.id,
      school_id: @school.id,
      contact_name: 'Contact',
      contact_phone: '13800138000',
      student_count: 35
    )

    assert_not booking.persisted?
    assert @service.errors.any? { |e| e.include?('名额') || e.include?('超过可用') }
  end

  test 'confirm booking should update status' do
    booking = Booking.create!(
      course_session: @session,
      school: @school,
      booking_type: :school_group,
      contact_name: 'Contact',
      contact_phone: '13800138000',
      student_count: 10,
      created_by: @user
    )

    assert booking.pending?
    result = @service.confirm_booking(booking)
    assert result
    assert booking.reload.confirmed?
  end

  test 'confirm non-pending booking should fail' do
    booking = Booking.create!(
      course_session: @session,
      school: @school,
      booking_type: :school_group,
      contact_name: 'Contact',
      contact_phone: '13800138000',
      student_count: 10,
      status: :confirmed,
      created_by: @user
    )

    result = @service.confirm_booking(booking)
    assert_not result
    assert_includes @service.errors, '只有待确认状态的报名可以确认'
  end

  test 'session capacity calculation' do
    assert_equal 30, @session.available_slots

    Booking.create!(
      course_session: @session,
      school: @school,
      booking_type: :school_group,
      contact_name: 'Contact',
      contact_phone: '13800138000',
      student_count: 10,
      status: :confirmed,
      created_by: @user
    )

    @session.reload
    assert_equal 20, @session.available_slots
    assert @session.has_capacity?(15)
    assert_not @session.has_capacity?(25)
  end
end
