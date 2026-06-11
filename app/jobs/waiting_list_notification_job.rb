class WaitingListNotificationJob < ApplicationJob
  queue_as :default

  def perform(waiting_list_id, notification_type = "release")
    entry = WaitingList.find_by(id: waiting_list_id)
    return { success: false, reason: "waiting_list_not_found" } unless entry

    case notification_type.to_s
    when "release"
      handle_release_notification(entry)
    when "reminder"
      handle_reminder_notification(entry)
    when "expiration"
      handle_expiration_notification(entry)
    else
      { success: false, reason: "unknown_notification_type" }
    end
  rescue => e
    Rails.logger.error "WaitingListNotificationJob error: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
    { success: false, reason: e.message }
  end

  private

  def handle_release_notification(entry)
    return { success: false, reason: "status_not_waiting" } unless entry.status == "waiting"

    result = entry.send_release_notification!
    return { success: false, reason: "notification_failed" } unless result

    deadline = result[:deadline]
    if deadline && deadline > Time.current
      WaitingListConfirmationTimeoutJob.set(wait_until: deadline).perform_later(entry.id)
    end

    Rails.logger.info "Release notification sent for WL##{entry.tracking_code}, deadline: #{deadline}"

    {
      success: true,
      notification_type: "release",
      notification_id: result[:notification]&.id,
      deadline: deadline
    }
  end

  def handle_reminder_notification(entry)
    rule = entry.waiting_list_rule || WaitingListRule.default_rule
    return { success: false, reason: "no_rule" } unless rule

    message = "[口腔诊所] 提醒#{entry.customer.name}，您候补的#{entry.doctor.name}医生洁牙时段请尽快确认，退订回T"

    notification = entry.waiting_list_notifications.create!(
      notification_type: "reminder",
      channel: rule.notify_channel || "sms",
      recipient: entry.contact_phone || entry.customer&.phone,
      content: message,
      operator: "system_reminder"
    )
    notification.send!

    { success: true, notification_id: notification.id }
  end

  def handle_expiration_notification(entry)
    rule = entry.waiting_list_rule || WaitingListRule.default_rule
    return { success: false, reason: "no_rule" } unless rule

    message = "[口腔诊所] 很抱歉#{entry.customer.name}，您候补的#{entry.doctor.name}医生洁牙时段已超时取消，退订回T"

    notification = entry.waiting_list_notifications.create!(
      notification_type: "expiration",
      channel: rule.notify_channel || "sms",
      recipient: entry.contact_phone || entry.customer&.phone,
      content: message,
      operator: "system_expiration"
    )
    notification.send!

    { success: true, notification_id: notification.id }
  end
end
