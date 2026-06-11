class WaitingListNotificationJob < ApplicationJob
  queue_as :default

  def perform(waiting_list_id)
    entry = WaitingList.find_by(id: waiting_list_id)
    return unless entry
    return unless entry.status == "waiting"

    rule = entry.waiting_list_rule || WaitingListRule.default_rule
    return unless rule

    deadline = rule.confirmation_deadline_for(entry.time_slot) if entry.time_slot

    send_notification(entry, deadline)

    if deadline && deadline < Time.current
      WaitingListConfirmationTimeoutJob.set(wait_until: deadline).perform_later(entry.id)
    end
  end

  private

  def send_notification(entry, deadline)
    message = build_message(entry, deadline)

    case rule&.notify_channel
    when "sms"
      send_sms(entry.contact_phone, message)
    when "wechat"
      send_wechat(entry.customer, message)
    else
      send_sms(entry.contact_phone, message)
    end

    entry.update!(notified_at: Time.current)
    Rails.logger.info "Notification sent to #{entry.contact_phone} for WL##{entry.tracking_code}"
  end

  def build_message(entry, deadline)
    slot_info = entry.time_slot ? "#{entry.time_slot.start_time.strftime('%m月%d日 %H:%M')}" : ""
    deadline_info = deadline ? "请于#{deadline.strftime('%H:%M')}前确认" : ""
    "[口腔诊所] 您好#{entry.customer.name}，您候补的#{entry.doctor.name}医生#{slot_info}洁牙时段已有空位。#{deadline_info}，退订回T"
  end

  def send_sms(phone, message)
    Rails.logger.info "[SMS Mock] To: #{phone}, Message: #{message}"
  end

  def send_wechat(customer, message)
    Rails.logger.info "[WeChat Mock] To: #{customer&.name}, Message: #{message}"
  end
end
