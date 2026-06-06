class ExportJob < ApplicationJob
  queue_as :exports

  def perform(export_id)
    export = Export.find_by(id: export_id)
    return unless export

    export.processing!
    user = export.user

    case export.export_type.to_sym
    when :bookings
      export_bookings(export, user)
    when :guide_schedule
      export_guide_schedule(export, user)
    when :students
      export_students(export, user)
    end
  rescue => e
    export&.update!(status: :failed, error_message: e.message)
    Rails.logger.error "Export failed: #{e.message}"
  end

  private

  def normalize_filters(filters)
    (filters || {}).with_indifferent_access
  end

  def export_bookings(export, user)
    filters = normalize_filters(export.filters)
    bookings = filter_bookings(filters, user)
    data = ExportService.new(user).export_bookings_to_excel(bookings)
    save_export_file(export, data)
  end

  def export_guide_schedule(export, user)
    filters = normalize_filters(export.filters)
    assignments = filter_guide_assignments(filters)
    data = ExportService.new(user).export_guide_schedule_to_excel(assignments)
    save_export_file(export, data)
  end

  def export_students(export, user)
    filters = normalize_filters(export.filters)
    students = filter_students(filters, user)
    data = ExportService.new(user).export_students_to_excel(students)
    save_export_file(export, data)
  end

  def filter_bookings(filters, user)
    scope = Booking.all
    
    start_date = parse_date(filters[:start_date] || filters['start_date'])
    end_date = parse_date(filters[:end_date] || filters['end_date'])
    
    if start_date && end_date
      scope = scope.joins(:course_session).where(course_sessions: { start_time: start_date.beginning_of_day..end_date.end_of_day })
    end
    
    if filters[:status].present? && Booking.statuses.key?(filters[:status].to_s)
      scope = scope.where(status: filters[:status])
    end
    
    if filters[:booking_type].present? && Booking.booking_types.key?(filters[:booking_type].to_s)
      scope = scope.where(booking_type: filters[:booking_type])
    end
    
    scope = scope.where(school_id: filters[:school_id]) if filters[:school_id].present?
    scope = scope.where(created_by: filters[:responsible_id]) if filters[:responsible_id].present?
    scope = scope.where(created_by: filters[:created_by_id]) if filters[:created_by_id].present?
    
    if user.school_teacher? && user.school_id
      scope = scope.where(school_id: user.school_id)
    end
    
    scope.order(created_at: :desc)
  end

  def filter_guide_assignments(filters)
    scope = GuideAssignment.all
    
    start_date = parse_date(filters[:start_date])
    end_date = parse_date(filters[:end_date])
    
    if start_date && end_date
      scope = scope.joins(:course_session).where(course_sessions: { start_time: start_date.beginning_of_day..end_date.end_of_day })
    end
    
    scope = scope.where(guide_id: filters[:guide_id]) if filters[:guide_id].present?
    scope = scope.where(assigned_by: filters[:responsible_id]) if filters[:responsible_id].present?
    
    if filters[:status].present? && GuideAssignment.statuses.key?(filters[:status].to_s)
      scope = scope.where(status: filters[:status])
    end
    
    if filters[:school_id].present?
      scope = scope.joins(course_session: :bookings)
                   .where(bookings: { school_id: filters[:school_id] })
    end
    
    scope.order(created_at: :desc)
  end

  def filter_students(filters, user)
    scope = Student.all
    
    scope = scope.where(school_id: filters[:school_id]) if filters[:school_id].present?
    scope = scope.where(grade: filters[:grade]) if filters[:grade].present?
    
    if user.school_teacher? && user.school_id
      scope = scope.where(school_id: user.school_id)
    end
    
    scope.order(created_at: :desc)
  end

  def parse_date(date_str)
    Date.parse(date_str) if date_str.present?
  rescue Date::Error
    nil
  end

  def save_export_file(export, data)
    timestamp = Time.current.strftime('%Y%m%d%H%M%S')
    filename = "#{export.export_type}_#{timestamp}.xlsx"
    dir_path = Rails.root.join('storage', 'exports')
    FileUtils.mkdir_p(dir_path) unless File.directory?(dir_path)
    
    file_path = File.join(dir_path, filename)
    File.open(file_path, 'wb') { |f| f.write(data) }
    
    export.update!(
      status: :completed,
      filename: filename,
      file_path: file_path,
      file_size: data.bytesize
    )
    
    { filename: filename, file_path: file_path, size: data.bytesize }
  end
end
