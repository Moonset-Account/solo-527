class DashboardService < ApplicationService
  def initialize(params = {}, current_user = nil)
    super()
    @params = params.with_indifferent_access
    @current_user = current_user
    apply_filters
  end

  def overview_stats
    {
      upcoming_sessions: filtered_sessions.upcoming.count,
      pending_bookings: filtered_bookings.pending.count,
      active_guides: Guide.active.count,
      total_students: Student.count,
      today_sessions: filtered_sessions.where(start_time: Date.today.beginning_of_day..Date.today.end_of_day).count,
      today_check_ins: filtered_check_ins.count
    }
  end

  def sessions_by_status
    filtered_sessions.group(:status).count.transform_keys { |k| CourseSession.statuses.key(k) || k.to_s }
  end

  def bookings_by_type
    filtered_bookings.group(:booking_type).count.transform_keys { |k| Booking.booking_types.key(k) || k.to_s }
  end

  def bookings_by_status
    filtered_bookings.group(:status).count.transform_keys { |k| Booking.statuses.key(k) || k.to_s }
  end

  def guide_utilization(days = 30)
    default_start = days.days.ago.to_date
    default_end = Date.today
    
    start_date = @start_date || default_start
    end_date = @end_date || default_end
    date_range = start_date.beginning_of_day..end_date.end_of_day
    actual_days = [(end_date - start_date).to_i, days, 1].max
    
    assignments = filtered_guide_assignments(date_range)
    
    guide_assignments = assignments.group_by(&:guide_id)
    guide_ids = guide_assignments.keys
    guides = Guide.active.where(id: guide_ids).index_by(&:id)
    
    guide_ids.map do |guide_id|
      guide = guides[guide_id]
      next unless guide
      
      guide_as = guide_assignments[guide_id]
      working_days = guide_as.map { |a| a.course_session.start_time.to_date }.uniq.count
      total_assignments = guide_as.count
      
      {
        guide_id: guide.id,
        guide_name: guide.name,
        working_days: working_days,
        total_assignments: total_assignments,
        utilization_rate: (working_days.to_f / actual_days * 100).round(1)
      }
    end.compact.sort_by { |g| -g[:utilization_rate] }
  end

  def session_occupancy_rate(start_date = nil, end_date = nil)
    start_date ||= @start_date || 30.days.ago.to_date
    end_date ||= @end_date || Date.today
    
    sessions = filtered_sessions.where(start_time: start_date.beginning_of_day..end_date.end_of_day)
    sessions.map do |session|
      booked = session.total_booked_students
      capacity = session.max_participants
      {
        session_id: session.id,
        course_title: session.course.title,
        start_time: session.start_time,
        capacity: capacity,
        booked: booked,
        occupancy_rate: capacity.zero? ? 0 : (booked.to_f / capacity * 100).round(1)
      }
    end.sort_by { |s| s[:start_time] }
  end

  def bottleneck_analysis
    days = @params[:days]&.to_i || 30
    {
      low_occupancy_sessions: low_occupancy_sessions(days),
      underutilized_guides: underutilized_guides(days),
      pending_bookings: filtered_bookings.pending.order(created_at: :asc).limit(10)
                                       .as_json(include: { course_session: { only: [:id, :start_time] }, school: { only: [:id, :name] } }),
      upcoming_without_guides: upcoming_sessions_without_guides
                                          .as_json(include: { course: { only: [:id, :title] } })
    }
  end

  private

  def apply_filters
    @start_date = parse_date(@params[:start_date])
    @end_date = parse_date(@params[:end_date])
    @status = @params[:status]
    @responsible_id = @params[:responsible_id] || @params[:assigned_by_id] || @params[:created_by_id]
    @guide_id = @params[:guide_id]
    @school_id = @params[:school_id]
  end

  def parse_date(date_str)
    Date.parse(date_str.to_s) if date_str.present?
  rescue Date::Error
    nil
  end

  def filtered_sessions
    scope = CourseSession.all
    
    if @start_date && @end_date
      scope = scope.where(start_time: @start_date.beginning_of_day..@end_date.end_of_day)
    elsif @start_date
      scope = scope.where('start_time >= ?', @start_date.beginning_of_day)
    elsif @end_date
      scope = scope.where('start_time <= ?', @end_date.end_of_day)
    end
    
    if @status.present? && CourseSession.statuses.key?(@status.to_s)
      scope = scope.where(status: @status)
    end
    
    if @guide_id.present?
      scope = scope.joins(:guide_assignments).where(guide_assignments: { guide_id: @guide_id })
    end
    
    if @school_id.present?
      scope = scope.joins(:bookings).where(bookings: { school_id: @school_id })
    end
    
    if @responsible_id.present?
      scope = scope.joins(:bookings).where(bookings: { created_by: @responsible_id })
    end
    
    scope.distinct
  end

  def filtered_bookings
    scope = Booking.all
    
    if @start_date && @end_date
      scope = scope.joins(:course_session).where(course_sessions: { start_time: @start_date.beginning_of_day..@end_date.end_of_day })
    end
    
    if @status.present? && Booking.statuses.key?(@status.to_s)
      scope = scope.where(status: @status)
    end
    
    scope = scope.where(created_by: @responsible_id) if @responsible_id.present?
    scope = scope.where(school_id: @school_id) if @school_id.present?
    
    if @current_user&.school_teacher? && @current_user.school_id
      scope = scope.where(school_id: @current_user.school_id)
    end
    
    scope
  end

  def filtered_check_ins
    scope = BookingStudent.joins(booking: :course_session)
    
    if @start_date && @end_date
      scope = scope.where(course_sessions: { start_time: @start_date.beginning_of_day..@end_date.end_of_day })
    end
    
    scope = scope.where(checked_in_at: Date.today.beginning_of_day..Date.today.end_of_day)
    scope
  end

  def low_occupancy_sessions(days)
    date_end = @end_date&.end_of_day || Time.current
    date_start = @start_date&.beginning_of_day || days.days.ago
    
    sessions = filtered_sessions.where(start_time: date_start..date_end)
    sessions = sessions.where(status: [:scheduled, :completed])
    
    sessions.select do |s|
      s.max_participants > 0 && (s.total_booked_students.to_f / s.max_participants) < 0.5
    end.map do |s|
      {
        session_id: s.id,
        course_title: s.course.title,
        start_time: s.start_time,
        max_participants: s.max_participants,
        booked_count: s.total_booked_students,
        occupancy_rate: s.max_participants > 0 ? (s.total_booked_students.to_f / s.max_participants * 100).round(1) : 0
      }
    end
  end

  def underutilized_guides(days)
    threshold = 0.3
    default_start = days.days.ago.to_date
    default_end = Date.today
    start_date = @start_date || default_start
    end_date = @end_date || default_end
    date_range = start_date.beginning_of_day..end_date.end_of_day
    actual_days = [(end_date - start_date).to_i, days, 1].max
    
    assignments = filtered_guide_assignments(date_range)
    
    guide_assignments = assignments.group_by(&:guide_id)
    guide_ids = guide_assignments.keys
    guides = Guide.active.where(id: guide_ids).index_by(&:id)
    
    guide_ids.map do |guide_id|
      guide = guides[guide_id]
      next unless guide
      
      guide_as = guide_assignments[guide_id]
      assignments_count = guide_as.count
      utilization_rate = (assignments_count.to_f / actual_days * 100).round(1)
      
      next unless utilization_rate < threshold * 100
      
      {
        guide_id: guide.id,
        guide_name: guide.name,
        assignments_count: assignments_count,
        utilization_rate: utilization_rate
      }
    end.compact
  end

  def upcoming_sessions_without_guides
    filtered_sessions.upcoming
                     .left_joins(:guide_assignments)
                     .where(guide_assignments: { id: nil })
                     .order(:start_time)
                     .limit(10)
  end

  private

  def filtered_guide_assignments(date_range)
    scope = GuideAssignment.joins(:course_session)
                           .includes(:guide, :course_session)
                           .where(course_sessions: { start_time: date_range })
    
    scope = scope.where(guide_id: @guide_id) if @guide_id.present?
    scope = scope.where(assigned_by: @responsible_id) if @responsible_id.present?
    scope = scope.where(status: @status) if @status.present? && GuideAssignment.statuses.key?(@status.to_s)
    
    if @school_id.present?
      scope = scope.joins(course_session: :bookings)
                   .where(bookings: { school_id: @school_id })
    end
    
    scope
  end
end
