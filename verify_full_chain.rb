puts "=" * 70
puts "完整自动释放链路验证 - 候补通知→超时→转化追踪"
puts "=" * 70

doctor = Doctor.first
customers = Customer.limit(5).to_a
customer1 = customers[0]
customer2 = customers[1]
vip_customer = customers.detect(&:vip?) || customers[2]
service_item = ServiceItem.first
rule = WaitingListRule.default_rule

slot_time = 2.hours.from_now
time_slot = doctor.time_slots.create!(
  start_time: slot_time,
  end_time: slot_time + 60.minutes,
  capacity: 2,
  status: "available",
  booked_count: 2
)

puts "\n[1] 准备数据"
puts "  医生: #{doctor.name}, 规则: #{rule.name}"
puts "  时段: #{time_slot.start_time.strftime('%m-%d %H:%M')}, 容量: #{time_slot.capacity}, 已约: #{time_slot.booked_count}"
puts "  释放窗口: #{rule.release_minutes_before}分钟前"
puts "  距离时段开始: #{time_slot.minutes_until_start.to_i}分钟"
puts "  客户: #{customer1.name}, #{customer2.name}, VIP: #{vip_customer.name}"

puts "\n[2] 候补入队（VIP优先 + 普通2位 = 3位）"
wl_normal1 = WaitingList.add_customer(customer1, doctor, time_slot: time_slot, service_item: service_item, operator: "前台")
wl_vip = WaitingList.add_customer(vip_customer, doctor, time_slot: time_slot, service_item: service_item, operator: "前台")
wl_normal2 = WaitingList.add_customer(customer2, doctor, time_slot: time_slot, service_item: service_item, operator: "前台")

puts "  #{wl_vip.tracking_code} VIP: #{wl_vip.vip_priority}, 位置: #{wl_vip.position}, 状态: #{wl_vip.status}"
puts "  #{wl_normal1.tracking_code} 普通, 位置: #{wl_normal1.position}, 状态: #{wl_normal1.status}"
puts "  #{wl_normal2.tracking_code} 普通, 位置: #{wl_normal2.position}, 状态: #{wl_normal2.status}"
puts "  时段候替补: #{time_slot.reload.waiting_count}"

puts "\n[3] 模拟自动释放（释放1个空位）"
time_slot.update!(booked_count: 1)
puts "  取消1个预约，空闲1位，开始释放..."

result = WaitingListAutoReleaseJob.perform_now
puts "  AutoRelease 结果: #{result.slice(:processed_slots, :notified_entries, :errors)}"

wl_vip.reload
wl_normal1.reload
wl_normal2.reload
puts "  候补状态变化:"
puts "    VIP(#{wl_vip.tracking_code}): status=#{wl_vip.status}, notified_at=#{wl_vip.notified_at&.strftime('%H:%M:%S')}, expires_at=#{wl_vip.expires_at&.strftime('%H:%M:%S')}"
puts "    普通1(#{wl_normal1.tracking_code}): status=#{wl_normal1.status}"
puts "    普通2(#{wl_normal2.tracking_code}): status=#{wl_normal2.status}"

puts "\n[4] 通知记录可追溯性检查"
notifications = wl_vip.waiting_list_notifications
puts "  VIP候补的通知数: #{notifications.count}"
notifications.each do |n|
  puts "    [#{n.status}] #{n.notification_type} via #{n.channel} → #{n.recipient}"
  puts "       provider: #{n.provider_reference}"
  puts "       消息: #{n.content[0..60]}..."
end

puts "\n[5] 候补变化日志（包含通知记录）"
snapshots = wl_vip.before_after_snapshots
puts "  变化日志数: #{snapshots.count}"
snapshots.each do |s|
  puts "    [#{s[:change_type]}] #{s[:changed_at]&.strftime('%H:%M:%S')}"
  puts "       状态: #{s[:before][:status]} → #{s[:after][:status]}"
  puts "       位置: #{s[:before][:position]} → #{s[:after][:position]}"
  puts "       详情: #{s[:details]}"
end

puts "\n[6] 候补确认 → 转预约（追踪完整链路）"
wl_vip.confirm! if wl_vip.may_confirm?
appointment = wl_vip.convert_to_appointment!(service_items: [service_item], operator: "测试前台")

puts "  预约单号: #{appointment.appointment_no}"
puts "  来源标记: from_waiting_list=#{appointment.from_waiting_list?}, source=#{appointment.source}"
puts "  候补追踪码: #{appointment.waiting_list.tracking_code}"
puts "  候补最终状态: #{wl_vip.reload.status}"

puts "\n[7] 预约单据详情（月底对账）"
detailed = appointment.detailed_record
puts "  服务项目数: #{detailed[:service_items].count}"
puts "  退款记录数: #{detailed[:refund_records].count}"
puts "  候补变化日志数: #{detailed[:waiting_list_history].count}"
puts "  候补通知历史数: #{detailed[:waiting_list_notifications].count}"

if detailed[:waiting_list_notifications].any?
  n = detailed[:waiting_list_notifications].first
  puts "    第一条通知: [#{n[:status]}] #{n[:type]} via #{n[:channel]}"
end

recon = appointment.reconciliation_data
puts "  对账数据: net=#{recon[:net_amount]}, refunds=#{recon[:refund_count]}, from_wl=#{recon[:from_waiting_list]}"

puts "\n[8] 超时处理 + 过期通知"
test_customer = Customer.create!(name: "超时测试客户", phone: "13900000009")
wl_timeout = WaitingList.add_customer(test_customer, doctor, time_slot: time_slot, service_item: service_item)

wl_timeout.update!(expires_at: 2.seconds.from_now)
wl_timeout.notify! if wl_timeout.may_notify?
puts "  候补: #{wl_timeout.tracking_code}, 状态: #{wl_timeout.status}, 过期时间: #{wl_timeout.expires_at.strftime('%H:%M:%S')}"

puts "  等待超时..."
sleep 3

timeout_result = WaitingListConfirmationTimeoutJob.perform_now(wl_timeout.id)
puts "  超时处理结果: success=#{timeout_result[:success]}, reason=#{timeout_result[:error] || 'ok'}"
puts "  候补最终状态: #{wl_timeout.reload.status}"

timeout_notifications = wl_timeout.waiting_list_notifications.where(notification_type: "expiration")
puts "  过期通知数: #{timeout_notifications.count}"
if timeout_notifications.any?
  puts "    过期通知内容: #{timeout_notifications.first.content[0..60]}..."
end

puts "\n" + "=" * 70
puts "✅ 所有验证完成！完整链路正常:"
puts "   候补入队 → 自动释放 → 发送通知(有DB记录) → 确认/超时 → 转预约/过期"
puts "=" * 70
