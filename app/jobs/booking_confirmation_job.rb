class BookingConfirmationJob < ApplicationJob
  queue_as :default

  def perform(booking_id)
    booking = Booking.find_by(id: booking_id)
    return unless booking

    Rails.logger.info "Booking ##{booking_id} confirmed: sending notifications"
    if booking.contact_email.present?
      Rails.logger.info "Would send confirmation email to #{booking.contact_email}"
    end
    if booking.contact_phone.present?
      Rails.logger.info "Would send confirmation SMS to #{booking.contact_phone}"
    end
  end
end
