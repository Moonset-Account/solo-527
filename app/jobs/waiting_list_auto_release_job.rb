class WaitingListAutoReleaseJob < ApplicationJob
  queue_as :default

  def perform
    rules = WaitingListRule.currently_effective.ordered_by_priority
    return if rules.empty?

    processed_slots = 0
    notified_entries = 0
    errors = []

    TimeSlot.upcoming.with_waiting_list.each do |time_slot|
      begin
        applicable_rule = rules.detect { |r| r.applies_to_time_slot?(time_slot) } || rules.first
        next unless applicable_rule

        if time_slot.minutes_until_start > applicable_rule.release_minutes_before
          next
        end

        slots_processed = process_time_slot(time_slot, applicable_rule)
        if slots_processed > 0
          processed_slots += 1
          notified_entries += slots_processed
        end
      rescue => e
        errors << "TimeSlot##{time_slot.id}: #{e.message}"
        Rails.logger.error "WaitingListAutoReleaseJob error on slot #{time_slot.id}: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
      end
    end

    summary = "WaitingListAutoReleaseJob: Processed #{processed_slots} slots, #{notified_entries} entries notified"
    summary += ", errors: #{errors.count}" if errors.any?
    Rails.logger.info summary
    { processed_slots: processed_slots, notified_entries: notified_entries, errors: errors }
  end

  private

  def process_time_slot(time_slot, rule)
    notified = 0

    WaitingList.for_time_slot(time_slot.id)
               .waiting
               .vip_first
               .each do |entry|
      break unless time_slot.reload.has_available_spots?

      begin
        if rule.auto_notify
          entry.transaction do
            WaitingListNotificationJob.perform_later(entry.id)
            entry.update!(notified_at: Time.current)
            entry.notify! if entry.may_notify?
          end
          notified += 1
        end
      rescue => e
        Rails.logger.error "Failed to notify WL##{entry.tracking_code}: #{e.message}"
      end
    end

    notified
  end
end
