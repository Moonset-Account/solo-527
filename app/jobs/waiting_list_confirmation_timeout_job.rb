class WaitingListConfirmationTimeoutJob < ApplicationJob
  queue_as :default

  def perform(waiting_list_id)
    entry = WaitingList.find_by(id: waiting_list_id)
    return { success: false, reason: "not_found" } unless entry
    return { success: false, reason: "wrong_status" } unless %w[waiting notified].include?(entry.status)

    result = { success: false }

    if entry.may_expire?
      ActiveRecord::Base.transaction do
        entry.expire!
        Rails.logger.info "WaitingList ##{entry.tracking_code} expired due to confirmation timeout"

        send_expiration_notification(entry)

        next_entry = notify_next_in_queue(entry)

        result = {
          success: true,
          expired_tracking: entry.tracking_code,
          next_notified: next_entry&.tracking_code
        }
      end
    end

    result
  rescue => e
    Rails.logger.error "WaitingListConfirmationTimeoutJob error on WL##{waiting_list_id}: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
    { success: false, error: e.message }
  end

  private

  def send_expiration_notification(entry)
    rule = entry.waiting_list_rule || WaitingListRule.default_rule
    return unless rule

    message = "[口腔诊所] 很抱歉#{entry.customer.name}，您候补的#{entry.doctor.name}医生洁牙时段已超时取消，退订回T"

    notification = entry.waiting_list_notifications.create!(
      notification_type: "expiration",
      channel: rule.notify_channel || "sms",
      recipient: entry.contact_phone || entry.customer&.phone,
      content: message,
      operator: "system_expiration"
    )
    notification.send!
    notification
  end

  def notify_next_in_queue(expired_entry)
    return nil unless expired_entry.time_slot

    next_entry = WaitingList.for_time_slot(expired_entry.time_slot_id)
                            .waiting
                            .where.not(id: expired_entry.id)
                            .vip_first
                            .first

    if next_entry
      rule = next_entry.waiting_list_rule || WaitingListRule.default_rule
      if rule && rule.auto_notify
        result = next_entry.send_release_notification!(rule)
        if result && result[:deadline] && result[:deadline] > Time.current
          WaitingListConfirmationTimeoutJob.set(wait_until: result[:deadline]).perform_later(next_entry.id)
        end
        Rails.logger.info "Notified next waiting list entry: WL##{next_entry.tracking_code}"
        next_entry
      end
    end
  end
end
