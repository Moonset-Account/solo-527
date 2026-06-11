doctor = Doctor.first
rule = WaitingListRule.default_rule

slot = doctor.time_slots.create!(
  start_time: 30.minutes.from_now,
  end_time: 90.minutes.from_now,
  capacity: 2,
  booked_count: 1
)

cust = Customer.create!(name: "调试客户", phone: "13700000001")
wl = WaitingList.add_customer(cust, doctor, time_slot: slot, service_item: ServiceItem.first)

slot.reload

puts "=== AutoReleaseJob 调试 ==="
puts "时段ID: #{slot.id}"
puts "start_time: #{slot.start_time}"
puts "waiting_count: #{slot.waiting_count}"
puts "available_spots: #{slot.available_spots}"
puts "minutes_until_start: #{slot.minutes_until_start}"
puts "rule.release_minutes_before: #{rule.release_minutes_before}"
puts "rule.auto_notify: #{rule.auto_notify}"
puts "rule.applies_to_time_slot?: #{rule.applies_to_time_slot?(slot)}"

puts "\nScope 检查:"
upcoming_count = TimeSlot.upcoming.where(id: slot.id).count
puts "  upcoming: #{upcoming_count}"
with_wl_count = TimeSlot.with_waiting_list.where(id: slot.id).count
puts "  with_waiting_list: #{with_wl_count}"
both_count = TimeSlot.upcoming.with_waiting_list.where(id: slot.id).count
puts "  upcoming.with_waiting_list: #{both_count}"

puts "\n直接调用 process_slot_notifications:"
job = WaitingListAutoReleaseJob.new
result = job.send(:process_slot_notifications, slot, rule)
puts "  notified: #{result}"

puts "\n现在重新执行整个 AutoReleaseJob:"
slot.reload
release_result = WaitingListAutoReleaseJob.perform_now
puts "  result: #{release_result}"
