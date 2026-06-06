class BookingCancellationJob < ApplicationJob
  queue_as :default

  def perform(booking_id)
    booking = Booking.find_by(id: booking_id)
    return unless booking

    Rails.logger.info "Booking ##{booking_id} cancelled: sending notifications"
    if booking.contact_email.present?
      Rails.logger.info "Would send cancellation email to #{booking.contact_email}"
    end
  end
end
