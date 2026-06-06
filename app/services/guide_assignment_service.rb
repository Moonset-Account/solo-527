class GuideAssignmentService < ApplicationService
  def initialize(user = nil)
    super()
    @user = user
  end

  def assign_guide(guide, course_session, role = 'main')
    assignment = GuideAssignment.new(
      guide: guide,
      course_session: course_session,
      assigned_by: @user,
      role: role
    )

    unless assignment.valid?
      add_errors_from(assignment)
      return nil
    end

    if guide.has_overlapping_assignment?(course_session.start_time, course_session.end_time, course_session.id)
      add_error('讲解员在该时间段已有其他安排')
      return nil
    end

    assignment.save
    assignment
  end

  def batch_assign(guide_ids, course_session)
    results = { success: [], failed: [] }

    Array(guide_ids).each do |guide_id|
      guide = Guide.find_by(id: guide_id)
      next unless guide

      assignment = assign_guide(guide, course_session)
      if assignment&.persisted?
        results[:success] << assignment
      else
        results[:failed] << { guide_id: guide_id, errors: @errors.dup }
      end
      @errors.clear
    end

    results
  end

  def available_guides_for(course_session)
    Guide.available_for(course_session.start_time, course_session.end_time)
  end

  def cancel_assignment(assignment)
    assignment.cancel!
    true
  rescue AASM::InvalidTransition => e
    add_error(e.message)
    false
  end

  def guide_schedule(guide, start_date, end_date)
    GuideAssignment.joins(:course_session)
                   .where(guide: guide)
                   .where(course_sessions: { start_time: start_date.beginning_of_day..end_date.end_of_day })
                   .order('course_sessions.start_time ASC')
  end
end
