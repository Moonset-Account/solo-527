class TeacherSettlements::GenerateService < ApplicationService
  def call
    return error('老师不存在') unless teacher
    return error('日期参数不完整') unless params[:period_start] && params[:period_end]

    period_start = Date.parse(params[:period_start])
    period_end = Date.parse(params[:period_end])

    return error('开始日期不能晚于结束日期') if period_start > period_end

    result = nil

    ActiveRecord::Base.transaction do
      sessions = teacher.course_sessions
        .where(start_time: period_start.beginning_of_day..period_end.end_of_day)
        .where(status: :completed)

      total_sessions = sessions.count
      total_students = sessions.joins(:bookings)
        .where(bookings: { attendance_status: :checked_in })
        .distinct
        .count('bookings.student_id')

      base_amount = sessions.sum do |session|
        duration_hours = (session.end_time - session.start_time) / 3600.0
        duration_hours * teacher.hourly_rate
      end

      bonus_amount = calculate_bonus(sessions)

      @settlement = TeacherSettlement.new(
        teacher: teacher,
        period_start: period_start,
        period_end: period_end,
        total_sessions: total_sessions,
        total_students: total_students,
        base_amount: base_amount.round(2),
        bonus_amount: bonus_amount.round(2),
        deduction_amount: 0,
        status: :draft,
        details: build_details(sessions)
      )

      if @settlement.save
        log_audit('create', @settlement, {}, @settlement.attributes)
        result = success(@settlement)
      else
        result = error(@settlement.errors.full_messages)
      end
    end

    result
  rescue StandardError => e
    error(e.message)
  end

  private

  def teacher
    @teacher ||= Teacher.find_by(id: params[:teacher_id])
  end

  def calculate_bonus(sessions)
    sessions.sum do |session|
      checked_in_count = session.bookings.where(attendance_status: :checked_in).count
      if checked_in_count >= 5
        checked_in_count * 20
      else
        0
      end
    end
  end

  def build_details(sessions)
    sessions.map do |session|
      {
        course_session_id: session.id,
        course_title: session.course.title,
        date: session.start_time.strftime('%Y-%m-%d'),
        duration: ((session.end_time - session.start_time) / 3600.0).round(1),
        students: session.bookings.where(attendance_status: :checked_in).count,
        amount: (((session.end_time - session.start_time) / 3600.0) * teacher.hourly_rate).round(2)
      }
    end
  end
end
