class WaitingListAutoReleaseJob < ApplicationJob
  queue_as :default

  def perform
    rules = WaitingListRule.currently_effective.ordered_by_priority
    return { processed_slots: 0, notified_entries: 0, errors: ["no_active_rules"] } if rules.empty?

    processed_slots = 0
    notified_entries = 0
    skipped_entries = 0
    errors = []

    TimeSlot.upcoming.with_waiting_list.each do |time_slot|
      begin
        rule = find_applicable_rule(time_slot, rules)
        next unless rule

        unless should_release_for?(time_slot, rule)
          next
        end

        entries_notified = process_slot_notifications(time_slot, rule)
        if entries_notified > 0
          processed_slots += 1
          notified_entries += entries_notified
        end
      rescue => e
        errors << "TimeSlot##{time_slot.id}: #{e.message}"
        Rails.logger.error "WaitingListAutoReleaseJob slot error ##{time_slot.id}: #{e.message}\n#{e.backtrace.first(3).join("\n")}"
      end
    end

    summary = {
      processed_slots: processed_slots,
      notified_entries: notified_entries,
      skipped_entries: skipped_entries,
      errors: errors,
      timestamp: Time.current
    }

    Rails.logger.info "WaitingListAutoReleaseJob completed: #{summary.slice(:processed_slots, :notified_entries, :errors)}"
    summary
  end

  private

  def find_applicable_rule(time_slot, rules)
    rules.detect { |r| r.applies_to_time_slot?(time_slot) } || rules.first
  end

  def should_release_for?(time_slot, rule)
    minutes_until = time_slot.minutes_until_start
    minutes_until > 0 && minutes_until <= rule.release_minutes_before
  end

  def process_slot_notifications(time_slot, rule)
    return 0 unless rule.auto_notify

    notified = 0
    available_spots = time_slot.available_spots

    return 0 if available_spots <= 0

    WaitingList.for_time_slot(time_slot.id)
               .waiting
               .vip_first
               .limit(available_spots)
               .each do |entry|
      begin
        result = notify_entry(entry, rule)
        if result && result[:notification]
          notified += 1
        else
          Rails.logger.info "Skipped notification for WL##{entry.tracking_code}: #{result&.dig(:reason) || 'unknown'}"
        end
      rescue => e
        Rails.logger.error "Failed to notify WL##{entry.tracking_code}: #{e.message}"
      end
    end

    notified
  end

  def notify_entry(entry, rule)
    entry.send_release_notification!(rule)
  rescue => e
    Rails.logger.error "notify_entry error for WL##{entry.id}: #{e.message}"
    { success: false, reason: e.message }
  end
end
