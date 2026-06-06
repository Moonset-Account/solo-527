require 'test_helper'

class GuideAssignmentTest < ActiveSupport::TestCase
  setup do
    @course = Course.create!(title: 'Test', age_min: 6, age_max: 12, duration_minutes: 90, max_participants: 30)
    @guide = Guide.create!(name: 'Guide', phone: '13800138000', status: :active)
    @session1 = CourseSession.create!(
      course: @course,
      start_time: 1.day.from_now.change(hour: 9, min: 0, sec: 0),
      end_time: 1.day.from_now.change(hour: 11, min: 0, sec: 0),
      max_participants: 30
    )
  end

  test 'should not assign guide to overlapping sessions' do
    assignment1 = GuideAssignment.create!(guide: @guide, course_session: @session1)
    assert assignment1.persisted?

    session2 = CourseSession.create!(
      course: @course,
      start_time: 1.day.from_now.change(hour: 10, min: 0, sec: 0),
      end_time: 1.day.from_now.change(hour: 12, min: 0, sec: 0),
      max_participants: 30
    )

    assignment2 = GuideAssignment.new(guide: @guide, course_session: session2)
    assert_not assignment2.valid?
    assert_includes assignment2.errors[:guide], 'has an overlapping session assignment'
  end

  test 'should allow assignment to non-overlapping sessions' do
    assignment1 = GuideAssignment.create!(guide: @guide, course_session: @session1)
    assert assignment1.persisted?

    session2 = CourseSession.create!(
      course: @course,
      start_time: 1.day.from_now.change(hour: 13, min: 0, sec: 0),
      end_time: 1.day.from_now.change(hour: 15, min: 0, sec: 0),
      max_participants: 30
    )

    assignment2 = GuideAssignment.new(guide: @guide, course_session: session2)
    assert assignment2.valid?
  end

  test 'should only assign active guides' do
    inactive_guide = Guide.create!(name: 'Inactive', phone: '13900139000', status: :inactive)
    assignment = GuideAssignment.new(guide: inactive_guide, course_session: @session1)
    assert_not assignment.valid?
    assert_includes assignment.errors[:guide], 'must be active to be assigned'
  end

  test 'guide has_overlapping_assignment? should detect overlap' do
    GuideAssignment.create!(guide: @guide, course_session: @session1)

    assert @guide.has_overlapping_assignment?(
      1.day.from_now.change(hour: 10, min: 0, sec: 0),
      1.day.from_now.change(hour: 12, min: 0, sec: 0)
    )

    assert_not @guide.has_overlapping_assignment?(
      1.day.from_now.change(hour: 13, min: 0, sec: 0),
      1.day.from_now.change(hour: 15, min: 0, sec: 0)
    )
  end

  test 'Guide.available_for should exclude overlapping guides' do
    GuideAssignment.create!(guide: @guide, course_session: @session1)

    available = Guide.available_for(
      1.day.from_now.change(hour: 10, min: 0, sec: 0),
      1.day.from_now.change(hour: 12, min: 0, sec: 0)
    )

    assert_not_includes available, @guide
  end

  test 'should allow same guide to same session only once' do
    GuideAssignment.create!(guide: @guide, course_session: @session1)
    duplicate = GuideAssignment.new(guide: @guide, course_session: @session1)
    assert_not duplicate.valid?
  end
end
