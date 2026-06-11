class AppointmentNoShowCheckJob < ApplicationJob
  queue_as :default

  def perform
    appointments = Appointment.where(status: ["pending", "confirmed"])
                              .joins(:time_slot)
                              .where("time_slots.end_time < ?", 30.minutes.ago)

    appointments.each do |appt|
      if appt.may_mark_no_show?
        appt.mark_no_show!
        Rails.logger.info "Appointment #{appt.appointment_no} marked as no-show"
      end
    end

    Rails.logger.info "NoShowCheckJob: Processed #{appointments.count} appointments"
  end
end
