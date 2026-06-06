class ReminderJob < ApplicationJob
  queue_as :default

  def self.send_course_reminders
    enrollments = Enrollment
      .where(status: 'paid')
      .joins(:schedule)
      .where('schedules.start_time BETWEEN ? AND ?', 24.hours.from_now, 25.hours.from_now)

    enrollments.each do |enrollment|
      if enrollment.student && enrollment.student.email
        Rails.logger.info "Sending course reminder to #{enrollment.student.email} for enrollment ##{enrollment.id}"
      end
    end

    Rails.logger.info "Sent #{enrollments.count} course reminders"
  end

  def self.send_low_stock_alerts
    low_stock_kits = MaterialKit.where('stock <= warning_threshold')

    if low_stock_kits.any?
      AdminUser.where(role: ['super_admin', 'admin']).each do |admin|
        Rails.logger.info "Sending low stock alert to #{admin.email}"
      end
      Rails.logger.info "Sent low stock alerts for #{low_stock_kits.count} material kits"
    end
  end
end
