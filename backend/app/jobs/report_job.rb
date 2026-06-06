class ReportJob < ApplicationJob
  queue_as :default

  def self.send_weekly_report
    start_date = 1.week.ago
    end_date = Time.current

    report = {
      period: "#{start_date.to_date} to #{end_date.to_date}",
      total_enrollments: Enrollment.where(created_at: start_date..end_date).count,
      total_revenue: Enrollment.where(status: 'paid', created_at: start_date..end_date).sum(:amount_paid),
      new_works: Work.where(created_at: start_date..end_date).count,
      new_students: User.where(role: 'student', created_at: start_date..end_date).count
    }

    AdminUser.where(role: ['super_admin', 'admin']).each do |admin|
      Rails.logger.info "Sending weekly report to #{admin.email}: #{report.inspect}"
    end

    Rails.logger.info "Weekly report sent: #{report.inspect}"
  end
end
