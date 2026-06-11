class WaitingListNotificationJob < ApplicationJob
  queue_as :default

  def perform(waiting_list_id)
    entry = WaitingList.find_by(id: waiting_list_id)
    return unless entry
    return unless entry.status == "waiting"

    rule = entry.waiting_list_rule || WaitingListRule.default_rule
    return unless rule

    deadline = if entry.time_slot
                 rule.confirmation_deadline_for(entry.time_slot)
               else
                 rule.confirmation_timeout_minutes.minutes.from_now
               end

    send_notification(entry, deadline, rule)

    if deadline && deadline > Time.current
      WaitingListConfirmationTimeoutJob.set(wait_until: deadline).perform_later(entry.id)
    end

    entry.notify! if entry.may_notify?
    Rails.logger.info "WaitingListNotificationJob: Processed WL##{entry.tracking_code}, deadline: #{deadline}"
  end

  private

  def send_notification(entry, deadline, rule)
    message = build_message(entry, deadline)

    channel = rule.respond_to?(:notify_channel) ? rule.notify_channel : "sms"

    case channel
    when "wechat"
      send_wechat(entry.customer, message)
    else
      send_sms(entry.contact_phone, message)
    end

    entry.update!(notified_at: Time.current)
    Rails.logger.info "Notification sent to #{entry.contact_phone} for WL##{entry.tracking_code} via #{channel}"
  end

  def build_message(entry, deadline)
    slot_info = entry.time_slot ? "#{entry.time_slot.start_time.strftime('%m月%d日 %H:%M')}" : ""
    deadline_info = deadline ? "请于#{deadline.strftime('%m月%d日 %H:%M')}前确认" : ""
    "[口腔诊所] 您好#{entry.customer.name}，您候补的#{entry.doctor.name}医生#{slot_info}洁牙时段已有空位。#{deadline_info}，退订回T"
  end

  def send_sms(phone, message)
    Rails.logger.info "[SMS Mock] To: #{phone}, Message: #{message}"
  end

  def send_wechat(customer, message)
    Rails.logger.info "[WeChat Mock] To: #{customer&.name}, Message: #{message}"
  end
end
