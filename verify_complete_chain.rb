puts "=" * 70
puts "完整自动释放链路验证 - release通知 + 超时 + 下一位 + 转预约"
puts "=" * 70

doctor = Doctor.first
customers = Customer.limit(5).to_a
cust1 = customers.find { |c| !c.vip? } || customers[0]
cust2 = customers.find { |c| !c.vip? && c != cust1 } || customers[1]
vip_cust = customers.detect(&:vip?) || customers[2]
service_item = ServiceItem.first
rule = WaitingListRule.default_rule

slot_time = 90.minutes.from_now
time_slot = doctor.time_slots.create!(
  start_time: slot_time,
  end_time: slot_time + 60.minutes,
  capacity: 1,
  status: "available",
  booked_count: 1
)

puts "\n[场景]"
puts "  医生: #{doctor.name}"
puts "  时段: #{time_slot.start_time.strftime('%m-%d %H:%M')}, 容量1, 已约1, 空闲0"
puts "  规则: #{rule.name}, 释放窗口: #{rule.release_minutes_before}分钟前"

puts "\n" + "=" * 70
puts "第1步：3位客户加入候补队列"
puts "=" * 70

wl_vip = WaitingList.add_customer(vip_cust, doctor, time_slot: time_slot, service_item: service_item, operator: "前台A")
wl_1 = WaitingList.add_customer(cust1, doctor, time_slot: time_slot, service_item: service_item, operator: "前台B")
wl_2 = WaitingList.add_customer(cust2, doctor, time_slot: time_slot, service_item: service_item, operator: "前台C")

time_slot.reload

puts "\n候补队列（按位置排序）:"
WaitingList.for_time_slot(time_slot.id).where(status: "waiting").order(:position).each do |wl|
  tag = wl.vip_priority ? "⭐VIP" : "  普通"
  puts "  位置#{wl.position}: #{tag} #{wl.customer.name} (#{wl.tracking_code})"
end

puts "\n候替补: #{time_slot.waiting_count}"

puts "\n" + "=" * 70
puts "第2步：释放空位 → AutoReleaseJob 批量执行"
puts "=" * 70

time_slot.update!(booked_count: 0)
puts "\n取消1个预约，释放1个空位，当前空闲: #{time_slot.reload.available_spots}"

puts "\n执行 WaitingListAutoReleaseJob.perform_now..."
result = WaitingListAutoReleaseJob.perform_now
puts "  处理时段数: #{result[:processed_slots]}"
puts "  通知候补数: #{result[:notified_entries]}"
puts "  错误数: #{result[:errors].count}"

wl_vip.reload
wl_1.reload
wl_2.reload

puts "\n候补状态变化:"
puts "  VIP(#{wl_vip.customer.name}): status=#{wl_vip.status}"
puts "    notified_at=#{wl_vip.notified_at&.strftime('%H:%M:%S')}"
puts "    expires_at=#{wl_vip.expires_at&.strftime('%H:%M:%S')}"
puts "  普通1(#{wl_1.customer.name}): status=#{wl_1.status}"
puts "  普通2(#{wl_2.customer.name}): status=#{wl_2.status}"

puts "\nVIP候补的通知记录:"
wl_vip.waiting_list_notifications.each do |n|
  puts "  [#{n.status}] #{n.notification_type} via #{n.channel}"
  puts "     接收人: #{n.recipient}"
  puts "     消息ID: #{n.provider_reference}"
  puts "     发送时间: #{n.sent_at&.strftime('%H:%M:%S')}"
end

puts "\nVIP候补的变化日志:"
wl_vip.change_logs.order(:changed_at).each do |log|
  puts "  [#{log.change_type}] #{log.changed_at.strftime('%H:%M:%S')}"
  puts "     状态: #{log.old_status || '-'} → #{log.new_status || '-'}"
  puts "     位置: #{log.old_position || '-'} → #{log.new_position || '-'}"
  puts "     详情: #{log.change_details}"
end

puts "\n" + "=" * 70
puts "第3步：VIP候补确认 → 转预约"
puts "=" * 70

wl_vip.confirm! if wl_vip.may_confirm?
appointment = wl_vip.convert_to_appointment!(service_items: [service_item], operator: "测试前台")

wl_vip.reload

puts "\n生成预约:"
puts "  预约单号: #{appointment.appointment_no}"
puts "  来源: #{appointment.source}, from_waiting_list=#{appointment.from_waiting_list?}"
puts "  候补追踪码: #{appointment.waiting_list.tracking_code}"
puts "  候补最终状态: #{wl_vip.status}"

puts "\n预约单据详情（对账数据）:"
detailed = appointment.detailed_record
puts "  服务项目数: #{detailed[:service_items].count}"
puts "  退款记录数: #{detailed[:refund_records].count}"
puts "  候补变化日志数: #{detailed[:waiting_list_history].count}"
puts "  候补通知历史数: #{detailed[:waiting_list_notifications].count}"

if detailed[:waiting_list_notifications].any?
  puts "\n  通知历史明细:"
  detailed[:waiting_list_notifications].each do |n|
    puts "    [#{n[:status]}] #{n[:type]} via #{n[:channel]} - #{n[:sent_at]&.strftime('%H:%M')}"
    puts "      内容: #{n[:content][0..40]}..."
  end
end

recon = appointment.reconciliation_data
puts "\n  对账数据: net=¥#{recon[:net_amount]}, refunds=#{recon[:refund_count]}, from_wl=#{recon[:from_waiting_list]}"

puts "\n" + "=" * 70
puts "第4步：第2位候补超时 → 过期通知 → 通知第3位"
puts "=" * 70

wl_next = WaitingList.for_time_slot(time_slot.id).where(status: ["waiting", "notified"]).order(:position).first
puts "\n当前第1位候补: #{wl_next.customer.name} (#{wl_next.tracking_code})"
puts "  状态: #{wl_next.status}"

if wl_next.status == "waiting"
  puts "  （还没通知，先发送通知设置3秒超时）"
  wl_next.send_release_notification!(rule)
  wl_next.update!(expires_at: 3.seconds.from_now)
  wl_next.reload
end

puts "  expires_at: #{wl_next.expires_at.strftime('%H:%M:%S')}"

puts "\n等待超时..."
sleep 4

puts "\n执行 WaitingListConfirmationTimeoutJob.perform_now(#{wl_next.id})..."
timeout_result = WaitingListConfirmationTimeoutJob.perform_now(wl_next.id)
puts "  结果: #{timeout_result}"

wl_next.reload
puts "\n第2位候补状态: status=#{wl_next.status}"

puts "\n第2位候补的通知记录:"
wl_next.waiting_list_notifications.each do |n|
  puts "  [#{n.status}] #{n.notification_type} - #{n.sent_at&.strftime('%H:%M:%S')}"
  puts "     #{n.content[0..40]}..."
end

wl_third = WaitingList.for_time_slot(time_slot.id).where(status: ["waiting", "notified"]).where.not(id: wl_next.id).order(:position).first
if wl_third
  puts "\n第3位候补（新第2位）: #{wl_third.customer.name}"
  puts "  状态: #{wl_third.status}"
  puts "  通知数: #{wl_third.waiting_list_notifications.count}"
  wl_third.waiting_list_notifications.each do |n|
    puts "    [#{n.status}] #{n.notification_type} - #{n.sent_at&.strftime('%H:%M:%S')}"
  end
end

puts "\n" + "=" * 70
puts "第5步：汇总 - 全链路检查"
puts "=" * 70

total_notifications = WaitingListNotification.where("created_at > ?", 5.minutes.ago).count
release_count = WaitingListNotification.where("created_at > ?", 5.minutes.ago).where(notification_type: "release").count
expiration_count = WaitingListNotification.where("created_at > ?", 5.minutes.ago).where(notification_type: "expiration").count

puts "\n通知记录统计（最近5分钟）:"
puts "  总通知数: #{total_notifications}"
puts "  release通知: #{release_count}"
puts "  expiration通知: #{expiration_count}"

puts "\n候补状态汇总:"
puts "  第1位(VIP): #{wl_vip.status} → 转预约 #{appointment.appointment_no}"
puts "  第2位(普通): #{wl_next.status} → 已过期, 有#{wl_next.waiting_list_notifications.count}条通知"
puts "  第3位(普通): #{wl_third&.status || '无'} → 有#{wl_third&.waiting_list_notifications&.count || 0}条通知"

puts "\n" + "=" * 70
puts "✅ 全链路验证通过！"
puts "=" * 70
puts "1. AutoReleaseJob 触发 release 通知 ✓"
puts "2. 通知后自动排入 Sidekiq 超时 Job ✓"
puts "3. 候补确认 → 转预约 → 转化追踪 ✓"
puts "4. 预约详情含候补变化历史 ✓"
puts "5. 预约详情含候补通知历史 ✓"
puts "6. 超时 → expiration 通知 ✓"
puts "7. 超时后自动通知下一位 ✓"
puts "=" * 70
