class AppointmentNoShowCheckJob < ApplicationJob
  queue_as :default

  def perform
    appointments = Appointment.where(status: ["pending", "confirmed"])
                              .joins(:time_slot)
                              .where("time_slots.end_time < ?", 30.minutes.ago)

    marked_count = 0
    appointments.each do |appt|
      begin
        if appt.may_mark_no_show?
          ActiveRecord::Base.transaction do
            appt.mark_no_show!
            marked_count += 1
            Rails.logger.info "Appointment #{appt.appointment_no} marked as no-show"
          end
        end
      rescue => e
        Rails.logger.error "Failed to mark no-show for #{appt.appointment_no}: #{e.message}\n#{e.backtrace.first(3).join("\n")}"
      end
    end

    Rails.logger.info "NoShowCheckJob: Marked #{marked_count}/#{appointments.count} appointments as no-show"
  end
end
