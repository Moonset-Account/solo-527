puts "=== AutoRelease 调试 ==="

doctor = Doctor.first
customer = Customer.first
vip_customer = Customer.where(vip: true).first || Customer.first
service_item = ServiceItem.first
rule = WaitingListRule.default_rule

slot_time = 30.minutes.from_now
time_slot = doctor.time_slots.create!(
  start_time: slot_time,
  end_time: slot_time + 60.minutes,
  capacity: 2,
  status: "available",
  booked_count: 2
)

puts "时段: #{time_slot.id}, start: #{time_slot.start_time}"
puts "minutes_until_start: #{time_slot.minutes_until_start}"
puts "rule.release_minutes_before: #{rule.release_minutes_before}"

puts "\n检查 scope:"
puts "  TimeSlot.upcoming.count: #{TimeSlot.upcoming.count}"
puts "  TimeSlot.with_waiting_list.count: #{TimeSlot.with_waiting_list.count}"
puts "  TimeSlot.upcoming.with_waiting_list.count: #{TimeSlot.upcoming.with_waiting_list.count}"

puts "\n加入2个候补:"
wl1 = WaitingList.add_customer(customer, doctor, time_slot: time_slot, service_item: service_item)
wl2 = WaitingList.add_customer(vip_customer, doctor, time_slot: time_slot, service_item: service_item)
puts "  wl1: #{wl1.tracking_code}, pos=#{wl1.position}, vip=#{wl1.vip_priority}, status=#{wl1.status}"
puts "  wl2: #{wl2.tracking_code}, pos=#{wl2.position}, vip=#{wl2.vip_priority}, status=#{wl2.status}"

time_slot.reload
puts "  time_slot.waiting_count: #{time_slot.waiting_count}"

puts "\n再次检查 scope:"
puts "  TimeSlot.with_waiting_list.where(id: #{time_slot.id}).count: #{TimeSlot.with_waiting_list.where(id: time_slot.id).count}"
puts "  TimeSlot.upcoming.where(id: #{time_slot.id}).count: #{TimeSlot.upcoming.where(id: time_slot.id).count}"
ts = TimeSlot.upcoming.with_waiting_list.where(id: time_slot.id).first
puts "  found timeslot: #{ts&.id}"

puts "\n检查 rule.applies_to_time_slot?:"
puts "  rule.active: #{rule.active}"
puts "  rule.effective_from: #{rule.effective_from}"
puts "  rule.effective_to: #{rule.effective_to}"
puts "  applies?: #{rule.applies_to_time_slot?(time_slot)}"

puts "\n检查 should_release_for?:"
minutes_until = time_slot.minutes_until_start
puts "  minutes_until: #{minutes_until}"
puts "  rule.release_minutes_before: #{rule.release_minutes_before}"
puts "  should release: #{minutes_until > 0 && minutes_until <= rule.release_minutes_before}"

puts "\n检查 waiting entries:"
entries = WaitingList.for_time_slot(time_slot.id).waiting.vip_first
puts "  count: #{entries.count}"
entries.each do |e|
  puts "    #{e.tracking_code}: pos=#{e.position}, vip=#{e.vip_priority}, status=#{e.status}"
end

puts "\n检查 available_spots:"
puts "  capacity: #{time_slot.capacity}, booked: #{time_slot.booked_count}, available: #{time_slot.available_spots}"

puts "\n手动测试 send_release_notification:"
wl = entries.first
puts "  测试 #{wl.tracking_code}:"
result = wl.send_release_notification!(rule)
puts "  result: #{result}"
puts "  wl.status: #{wl.reload.status}"
puts "  wl.notified_at: #{wl.notified_at}"
puts "  wl.expires_at: #{wl.expires_at}"
puts "  notifications count: #{wl.waiting_list_notifications.count}"
if wl.waiting_list_notifications.any?
  n = wl.waiting_list_notifications.first
  puts "    notification: #{n.notification_type}, status=#{n.status}, channel=#{n.channel}"
end

puts "\n=== 调试结束 ==="
