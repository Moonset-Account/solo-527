class WaitingListConfirmationTimeoutJob < ApplicationJob
  queue_as :default

  def perform(waiting_list_id)
    entry = WaitingList.find_by(id: waiting_list_id)
    return unless entry
    return unless %w[waiting notified].include?(entry.status)

    if entry.may_expire?
      ActiveRecord::Base.transaction do
        entry.expire!
        Rails.logger.info "WaitingList ##{entry.tracking_code} expired due to confirmation timeout"

        notify_next_in_queue(entry) if entry.time_slot
      end
    end
  rescue => e
    Rails.logger.error "WaitingListConfirmationTimeoutJob error on WL##{waiting_list_id}: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
  end

  private

  def notify_next_in_queue(expired_entry)
    next_entry = WaitingList.for_time_slot(expired_entry.time_slot_id)
                            .waiting
                            .where.not(id: expired_entry.id)
                            .vip_first
                            .first

    if next_entry
      rule = next_entry.waiting_list_rule || WaitingListRule.default_rule
      if rule && rule.auto_notify
        WaitingListNotificationJob.perform_later(next_entry.id)
        Rails.logger.info "Notified next waiting list entry: WL##{next_entry.tracking_code}"
      end
    end
  end
end
