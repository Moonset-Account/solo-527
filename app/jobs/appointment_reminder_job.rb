class AppointmentReminderJob < ApplicationJob
  queue_as :default

  def perform
    appointments = Appointment.confirmed
                              .where("appointment_date > ? AND appointment_date < ?",
                                     24.hours.from_now, 25.hours.from_now)

    appointments.each do |appt|
      send_reminder(appt)
    end

    Rails.logger.info "AppointmentReminderJob: Processed #{appointments.count} appointments"
  end

  private

  def send_reminder(appt)
    message = "[口腔诊所] 您好#{appt.customer.name}，提醒您明天#{appt.time_slot.start_time.strftime('%H:%M')}有#{appt.doctor.name}医生的洁牙预约，请准时到达。退订回T"
    Rails.logger.info "[Reminder Mock] To: #{appt.customer.phone}, Message: #{message}"
  end
end
