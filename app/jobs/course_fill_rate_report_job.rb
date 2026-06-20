class CourseFillRateReportJob < ApplicationJob
  queue_as :default

  def perform(course_id = nil)
    @batch_job = BatchJob.find_by(sidekiq_jid: job_id)

    courses = course_id ? [Course.find(course_id)] : Course.all
    set_total(courses.size)

    report_data = courses.map do |course|
      data = calculate_fill_rate(course)
      track_success
      data
    end

    @batch_job&.update!(
      result_data: {
        report_date: Date.today.to_s,
        total_courses: courses.size,
        average_fill_rate: report_data.any? ? (report_data.sum { |r| r[:fill_rate] } / report_data.size).round(2) : 0,
        courses: report_data
      }
    )
  end

  private

  def calculate_fill_rate(course)
    total_enrolled = course.enrolled_count
    capacity = course.capacity
    fill_rate = capacity.zero? ? 0.0 : (total_enrolled.to_f / capacity * 100).round(2)

    paid_count = course.course_enrollments.where(payment_status: "paid").count
    pending_payment_count = course.course_enrollments.where(payment_status: %w[pending failed]).count
    cancelled_count = course.course_enrollments.where(status: "cancelled").count
    leave_count = course.leave_requests.approved.count

    {
      course_id: course.id,
      course_name: course.name,
      capacity: capacity,
      enrolled_count: total_enrolled,
      paid_count: paid_count,
      pending_payment_count: pending_payment_count,
      cancelled_count: cancelled_count,
      leave_count: leave_count,
      fill_rate: fill_rate,
      status: course.status
    }
  end
end
