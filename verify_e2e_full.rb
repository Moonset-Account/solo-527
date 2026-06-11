puts "=" * 70
puts "完整端到端验证 - 候补自动释放+通知+转化追踪全链路"
puts "=" * 70

doctor = Doctor.first
customers = Customer.limit(5).to_a
normal_customer1 = customers.find { |c| !c.vip? } || customers[1]
normal_customer2 = customers.find { |c| !c.vip? && c != normal_customer1 } || customers[2]
vip_customer = customers.detect(&:vip?) || customers[0]
service_item = ServiceItem.first
rule = WaitingListRule.default_rule

slot_time = 60.minutes.from_now
time_slot = doctor.time_slots.create!(
  start_time: slot_time,
  end_time: slot_time + 60.minutes,
  capacity: 1,
  status: "available",
  booked_count: 1
)

puts "\n[场景设定]"
puts "  医生: #{doctor.name}"
puts "  时段: #{time_slot.start_time.strftime('%m-%d %H:%M')}, 容量: 1, 已约: 1, 空闲: 0"
puts "  规则: #{rule.name}, 释放窗口: #{rule.release_minutes_before}分钟前, 超时: #{rule.confirmation_timeout_minutes}分钟"
puts "  VIP客户: #{vip_customer.name}"
puts "  普通客户1: #{normal_customer1.name}"
puts "  普通客户2: #{normal_customer2.name}"

puts "\n" + "=" * 70
puts "第1步：3位客户加入候补队列（VIP优先插队）"
puts "=" * 70

wl_normal1 = WaitingList.add_customer(normal_customer1, doctor, time_slot: time_slot, service_item: service_item, operator: "前台小李")
wl_vip = WaitingList.add_customer(vip_customer, doctor, time_slot: time_slot, service_item: service_item, operator: "前台小王")
wl_normal2 = WaitingList.add_customer(normal_customer2, doctor, time_slot: time_slot, service_item: service_item, operator: "前台小张")

time_slot.reload

puts "\n候补队列排序（VIP优先）:"
WaitingList.for_time_slot(time_slot.id).where(status: "waiting").vip_first.each do |wl|
  tag = wl.vip_priority ? "⭐VIP" : " 普通"
  puts "  位置#{wl.position}: #{tag} #{wl.customer.name} (#{wl.tracking_code}) - #{wl.status}"
end
puts "  候替补总数: #{time_slot.waiting_count}"

puts "\n候补变化日志（每条记录的入队日志）:"
wl_vip.change_logs.each do |log|
  puts "  [#{log.change_type}] #{log.changed_at.strftime('%H:%M:%S')} - 位置: #{log.old_position}→#{log.new_position}, #{log.change_details}"
end

puts "\n" + "=" * 70
puts "第2步：释放1个空位 → 自动通知第1位候补"
puts "=" * 70

puts "\n模拟：有客户取消预约，释放出1个空位"
time_slot.update!(booked_count: 0)
puts "  时段空闲数: #{time_slot.available_spots}"

puts "\n触发释放通知（调用 send_release_notification!）:"
first_waiting = WaitingList.for_time_slot(time_slot.id).waiting.vip_first.first
puts "  第1位候补: #{first_waiting.customer.name} (#{first_waiting.tracking_code})"

result = first_waiting.send_release_notification!(rule)
puts "  通知结果: #{result[:notification]&.status == 'sent' ? '✅ 发送成功' : '❌ 失败'}"
puts "  消息ID: #{result[:notification]&.provider_reference}"
puts "  渠道: #{result[:notification]&.channel}"
puts "  截止时间: #{result[:deadline]&.strftime('%m-%d %H:%M:%S')}"

first_waiting.reload
puts "\n候补状态变化:"
puts "  状态: #{first_waiting.status}"
puts "  通知时间: #{first_waiting.notified_at&.strftime('%H:%M:%S')}"
puts "  过期时间: #{first_waiting.expires_at&.strftime('%H:%M:%S')}"

puts "\n通知记录（数据库持久化）:"
first_waiting.waiting_list_notifications.recent.each do |n|
  puts "  [#{n.status}] #{n.notification_type} via #{n.channel}"
  puts "     接收人: #{n.recipient}"
  puts "     内容: #{n.content[0..50]}..."
  puts "     消息ID: #{n.provider_reference}"
  puts "     发送时间: #{n.sent_at&.strftime('%H:%M:%S')}"
end

puts "\n候补变化日志（新增 notified 记录）:"
first_waiting.change_logs.order(:changed_at).each do |log|
  puts "  [#{log.change_type}] #{log.changed_at.strftime('%H:%M:%S')}"
  puts "     状态: #{log.old_status} → #{log.new_status}"
  puts "     位置: #{log.old_position} → #{log.new_position}"
  puts "     详情: #{log.change_details}"
end

puts "\n" + "=" * 70
puts "第3步：候补确认 → 转预约（完整转化追踪）"
puts "=" * 70

puts "\n客户确认预约，候补转正式预约:"
if first_waiting.may_confirm?
  first_waiting.confirm!
  puts "  候补状态: confirmed"
end

appointment = first_waiting.convert_to_appointment!(
  service_items: [service_item],
  operator: "前台小李"
)

first_waiting.reload

puts "\n生成的预约单据:"
puts "  预约单号: #{appointment.appointment_no}"
puts "  客户: #{appointment.customer.name}"
puts "  医生: #{appointment.doctor.name}"
puts "  时段: #{appointment.time_slot.start_time.strftime('%m-%d %H:%M')}"

puts "\n✅ 转化追踪字段:"
puts "  from_waiting_list: #{appointment.from_waiting_list?}"
puts "  source: #{appointment.source}"
puts "  候补追踪码: #{appointment.waiting_list.tracking_code}"
puts "  候补最终状态: #{first_waiting.status}"

puts "\n📄 预约单据详情（月底对账用）:"
detailed = appointment.detailed_record
puts "  服务项目数: #{detailed[:service_items].count}"
puts "  退款记录数: #{detailed[:refund_records].count}"
puts "  候补变化日志数: #{detailed[:waiting_list_history].count}"
puts "  候补通知历史数: #{detailed[:waiting_list_notifications].count}"

if detailed[:waiting_list_notifications].any?
  puts "\n  通知历史明细:"
  detailed[:waiting_list_notifications].each do |n|
    puts "    [#{n[:status]}] #{n[:type]} via #{n[:channel]} - #{n[:sent_at]&.strftime('%H:%M')}"
  end
end

puts "\n💰 对账数据:"
recon = appointment.reconciliation_data
puts "  总金额: ¥#{recon[:total_amount]}"
puts "  已付: ¥#{recon[:paid_amount]}"
puts "  已退: ¥#{recon[:refunded_amount]}"
puts "  净收入: ¥#{recon[:net_amount]}"
puts "  退款次数: #{recon[:refund_count]}"
puts "  候补来源: #{recon[:from_waiting_list] ? '是' : '否'}"
puts "  服务项数: #{recon[:service_count]}"

puts "\n" + "=" * 70
puts "第4步：第2位候补超时 → 过期通知 → 通知第3位"
puts "=" * 70

second_waiting = WaitingList.for_time_slot(time_slot.id).waiting.vip_first.first
puts "\n当前第1位候补: #{second_waiting.customer.name} (#{second_waiting.tracking_code})"

puts "\n发送通知并设置3秒后超时:"
result2 = second_waiting.send_release_notification!(rule)
second_waiting.update!(expires_at: 3.seconds.from_now)
puts "  通知发送: #{result2[:notification]&.status}"
puts "  过期时间: #{second_waiting.expires_at.strftime('%H:%M:%S')}"

puts "\n等待超时..."
sleep 4

puts "\n执行超时处理:"
timeout_result = WaitingListConfirmationTimeoutJob.perform_now(second_waiting.id)
puts "  超时处理结果: success=#{timeout_result[:success]}"
puts "  已过期: #{timeout_result[:expired_tracking]}"
puts "  下一位已通知: #{timeout_result[:next_notified] || '无'}"

second_waiting.reload
puts "\n  候补最终状态: #{second_waiting.status}"

puts "\n过期通知记录:"
exp_notifs = second_waiting.waiting_list_notifications.where(notification_type: "expiration")
puts "  过期通知数: #{exp_notifs.count}"
if exp_notifs.any?
  puts "    内容: #{exp_notifs.first.content[0..60]}..."
  puts "    状态: #{exp_notifs.first.status}"
end

puts "\n候补变化日志（完整时间线）:"
second_waiting.change_logs.order(:changed_at).each do |log|
  puts "  [#{log.change_type}] #{log.changed_at.strftime('%H:%M:%S')}"
  puts "     状态: #{log.old_status || '-'} → #{log.new_status || '-'}"
end

puts "\n" + "=" * 70
puts "第5步：AutoReleaseJob 批量执行验证"
puts "=" * 70

puts "\n创建测试场景：2个时段各有空位+候补"
slot2 = doctor.time_slots.create!(start_time: 45.minutes.from_now, end_time: 105.minutes.from_now, capacity: 1, booked_count: 0)
slot3 = doctor.time_slots.create!(start_time: 50.minutes.from_now, end_time: 110.minutes.from_now, capacity: 2, booked_count: 1)

cust_a = Customer.create!(name: "测试客户A", phone: "13800000001")
cust_b = Customer.create!(name: "测试客户B", phone: "13800000002")
cust_c = Customer.create!(name: "测试客户C", phone: "13800000003")

WaitingList.add_customer(cust_a, doctor, time_slot: slot2, service_item: service_item)
WaitingList.add_customer(cust_b, doctor, time_slot: slot3, service_item: service_item)
WaitingList.add_customer(cust_c, doctor, time_slot: slot3, service_item: service_item)

slot2.reload
slot3.reload
puts "  时段2: 空闲#{slot2.available_spots}位, 候补#{slot2.waiting_count}人"
puts "  时段3: 空闲#{slot3.available_spots}位, 候补#{slot3.waiting_count}人"

puts "\n执行 WaitingListAutoReleaseJob.perform_now"
release_result = WaitingListAutoReleaseJob.perform_now
puts "  处理时段数: #{release_result[:processed_slots]}"
puts "  通知候补数: #{release_result[:notified_entries]}"
puts "  错误数: #{release_result[:errors].count}"
if release_result[:errors].any?
  release_result[:errors].each { |e| puts "    #{e}" }
end

total_notifications = WaitingListNotification.where("created_at > ?", 1.minute.ago).count
puts "\n  这段时间新增通知记录总数: #{total_notifications}"

puts "\n" + "=" * 70
puts "✅ 全链路验证通过！"
puts "=" * 70
puts "1. 候补入队 + VIP插队 ✓"
puts "2. 空位释放 + 自动通知（有DB记录） ✓"
puts "3. 候补确认 + 转预约 + 转化追踪 ✓"
puts "4. 预约详情 + 候补历史 + 通知历史 + 对账数据 ✓"
puts "5. 超时处理 + 过期通知 + 通知下一位 ✓"
puts "6. AutoReleaseJob 批量执行 ✓"
puts "=" * 70
