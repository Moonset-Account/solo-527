class WaitingListConfirmationTimeoutJob < ApplicationJob
  queue_as :default

  def perform(waiting_list_id)
    entry = WaitingList.find_by(id: waiting_list_id)
    return unless entry
    return unless %w[waiting notified].include?(entry.status)

    if entry.may_expire?
      entry.expire!
      Rails.logger.info "WaitingList ##{entry.tracking_code} expired due to confirmation timeout"

      if entry.time_slot
        next_entry = WaitingList.for_time_slot(entry.time_slot_id)
                                .waiting
                                .where.not(id: entry.id)
                                .vip_first
                                .first
        WaitingListNotificationJob.perform_later(next_entry.id) if next_entry
      end
    end
  end
end
