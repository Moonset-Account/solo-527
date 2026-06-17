class RenewalNotificationJob < ApplicationJob
  queue_as :notifications

  def perform
    TreatmentCard.expiring_soon.find_each do |card|
      Notification.create_renewal_notice!(card)
    end
  end
end
