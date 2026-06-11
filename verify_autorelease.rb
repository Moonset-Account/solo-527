doctor = Doctor.first
rule = WaitingListRule.default_rule

slot = doctor.time_slots.create!(
  start_time: 45.minutes.from_now,
  end_time: 105.minutes.from_now,
  capacity: 2,
  booked_count: 1
)

cust = Customer.create!(name: "AutoRelease测试", phone: "13600000001")
wl = WaitingList.add_customer(cust, doctor, time_slot: slot, service_item: ServiceItem.first)

slot.reload

puts "测试前:"
puts "  时段: #{slot.id}, 空闲: #{slot.available_spots}, 候补: #{slot.waiting_count}"
puts "  候补状态: #{wl.status}, 通知数: #{wl.waiting_list_notifications.count}"

puts "\n执行 AutoReleaseJob..."
result = WaitingListAutoReleaseJob.perform_now
puts "  结果: #{result.slice(:processed_slots, :notified_entries, :errors)}"

wl.reload
puts "\n测试后:"
puts "  候补状态: #{wl.status}"
puts "  通知数: #{wl.waiting_list_notifications.count}"
if wl.waiting_list_notifications.any?
  n = wl.waiting_list_notifications.first
  puts "    通知: #{n.notification_type}, status=#{n.status}, channel=#{n.channel}"
end

puts "\n✅ AutoReleaseJob 修复验证通过!" if result[:notified_entries] > 0
