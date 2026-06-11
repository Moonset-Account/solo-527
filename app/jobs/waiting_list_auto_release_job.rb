class WaitingListAutoReleaseJob < ApplicationJob
  queue_as :default

  def perform
    rule = WaitingListRule.default_rule
    return unless rule

    release_time_threshold = rule.release_minutes_before.minutes.ago
    processed_count = 0

    TimeSlot.upcoming.with_waiting_list.each do |time_slot|
      next unless time_slot.minutes_until_start <= rule.release_minutes_before

      if time_slot.has_available_spots?
        WaitingList.for_time_slot(time_slot.id)
                   .waiting
                   .vip_first
                   .each do |entry|
          break unless time_slot.has_available_spots?

          if rule.auto_notify
            WaitingListNotificationJob.perform_later(entry.id)
            entry.update!(notified_at: Time.current)
            entry.notify! if entry.may_notify?
          end

          processed_count += 1
        end
      end
    end

    Rails.logger.info "WaitingListAutoReleaseJob: Processed #{processed_count} entries"
  end
end
