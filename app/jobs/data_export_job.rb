class DataExportJob < ApplicationJob
  queue_as :default

  def perform(export_type, options = {})
    @batch_job = BatchJob.find_by(sidekiq_jid: job_id)

    data = case export_type
           when "course_enrollments"
             export_course_enrollments(options)
           when "event_registrations"
             export_event_registrations(options)
           when "check_ins"
             export_check_ins(options)
           when "payments"
             export_payments(options)
           else
             raise "未知的导出类型: #{export_type}"
           end

    csv_data = generate_csv(data)
    file_path = save_export_file(export_type, csv_data)

    @batch_job&.update!(
      result_data: {
        export_type: export_type,
        record_count: data.size,
        file_path: file_path,
        download_url: "/exports/#{File.basename(file_path)}"
      }
    )

    track_success
  end

  private

  def export_course_enrollments(options)
    scope = CourseEnrollment.all
    scope = scope.where(course_id: options[:course_id]) if options[:course_id]
    scope = scope.where(status: options[:status]) if options[:status]
    scope = scope.includes(:user, :course).order(created_at: :desc)

    set_total(scope.count)

    results = []
    scope.find_each do |enrollment|
      results << {
        id: enrollment.id,
        user_name: enrollment.user.name,
        user_email: enrollment.user.email,
        course_name: enrollment.course.name,
        status: enrollment.status,
        payment_status: enrollment.payment_status,
        price: enrollment.price,
        enrolled_at: enrollment.enrolled_at,
        created_at: enrollment.created_at,
        source: enrollment.source
      }
      track_success
    end
    results
  end

  def export_event_registrations(options)
    scope = EventRegistration.all
    scope = scope.where(event_id: options[:event_id]) if options[:event_id]
    scope = scope.where(status: options[:status]) if options[:status]
    scope = scope.includes(:user, :event).order(created_at: :desc)

    set_total(scope.count)

    results = []
    scope.find_each do |reg|
      results << {
        id: reg.id,
        user_name: reg.user.name,
        user_email: reg.user.email,
        event_name: reg.event.name,
        category: reg.category,
        status: reg.status,
        payment_status: reg.payment_status,
        registration_fee: reg.registration_fee,
        registered_at: reg.registered_at,
        created_at: reg.created_at
      }
      track_success
    end
    results
  end

  def export_check_ins(options)
    scope = CheckIn.all
    scope = scope.where(status: options[:status]) if options[:status]
    scope = scope.where("DATE(created_at) = ?", options[:date]) if options[:date]
    scope = scope.includes(:user).order(created_at: :desc)

    set_total(scope.count)

    results = []
    scope.find_each do |check_in|
      results << {
        id: check_in.id,
        user_name: check_in.user.name,
        checkinable_type: check_in.checkinable_type,
        checkinable_id: check_in.checkinable_id,
        status: check_in.status,
        check_in_method: check_in.check_in_method,
        checked_in_at: check_in.checked_in_at,
        created_at: check_in.created_at
      }
      track_success
    end
    results
  end

  def export_payments(options)
    scope = Payment.all
    scope = scope.where(status: options[:status]) if options[:status]
    scope = scope.where("DATE(created_at) BETWEEN ? AND ?", options[:start_date], options[:end_date]) if options[:start_date] && options[:end_date]
    scope = scope.includes(:user).order(created_at: :desc)

    set_total(scope.count)

    results = []
    scope.find_each do |payment|
      results << {
        id: payment.id,
        user_name: payment.user.name,
        amount: payment.amount,
        payment_method: payment.payment_method,
        status: payment.status,
        transaction_id: payment.transaction_id,
        failure_reason: payment.failure_reason,
        payable_type: payment.payable_type,
        payable_id: payment.payable_id,
        paid_at: payment.paid_at,
        created_at: payment.created_at
      }
      track_success
    end
    results
  end

  def generate_csv(data)
    return "" if data.empty?

    headers = data.first.keys
    CSV.generate(headers: true) do |csv|
      csv << headers
      data.each do |row|
        csv << headers.map { |h| row[h] }
      end
    end
  end

  def save_export_file(export_type, csv_data)
    dir = Rails.root.join("public", "exports")
    FileUtils.mkdir_p(dir)

    filename = "#{export_type}_#{Time.current.strftime('%Y%m%d_%H%M%S')}.csv"
    file_path = dir.join(filename)
    File.write(file_path, csv_data)
    file_path.to_s
  end
end
